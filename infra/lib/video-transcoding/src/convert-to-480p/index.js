"use strict";

const { GetObjectCommand, S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const fsPromises = fs.promises;

const s3Client = new S3Client();

const process480p = async (event) => {
  const videoKey = event.key;
  const inputBucketName = process.env.S3_INPUT_BUCKET;
  const outputBucketName = process.env.S3_OUTPUT_BUCKET;
  const id = videoKey.split("/")[0];
  const filename = videoKey.split("/").at(-1);
  const params = { Bucket: inputBucketName, Key: videoKey };
  const downloadFile = `/tmp/${id}/${filename}`;

  await fsPromises.mkdir(`/tmp/${id}`, { recursive: true });

  const file = fs.createWriteStream(downloadFile);
  const s3Response = await s3Client.send(new GetObjectCommand(params));
  s3Response.Body.pipe(file);

  console.log(filename);
  console.log(downloadFile);

  await transcode(downloadFile, id, outputBucketName);
};

const transcode = async (downloadFile, id, outputBucketName) => {
  let totalTime;

  return new Promise((resolve, reject) => {
    ffmpeg(downloadFile)
      .on("start", () => {
        console.log(`transcoding ${id} to 480p`);
      })
      .on("error", (err, stdout, stderr) => {
        console.log("stderr:", stderr);
        console.error(err);
        reject(new Error(err));
      })
      .on("end", async () => {
        const fileUploadPromises = (await fsPromises.readdir(`/tmp/${id}`)).map((file) => {
          let params = { Bucket: outputBucketName, Key: `${id}/${file}`, Body: fs.readFileSync(`/tmp/${id}/${file}`) };
          console.log(`uploading ${file} to s3`);
          return s3Client.send(new PutObjectCommand(params));
        });
        await Promise.all(fileUploadPromises);
        await fsPromises.rm(`/tmp/${id}`, { recursive: true });
        console.log(`tmp is deleted!`);
        resolve();
      })
      .on("codecData", (data) => {
        totalTime = parseInt(data.duration.replace(/:/g, ""));
      })
      .on("progress", (progress) => {
        const time = parseInt(progress.timemark.replace(/:/g, ""));
        const percent = Math.ceil((time / totalTime) * 100);
        console.log(`progress :- ${percent}%`);
      })
      .outputOptions([
        "-vf scale=w=842:h=480",
        "-c:a aac",
        "-ar 48000",
        "-b:a 128k",
        "-c:v h264",
        "-profile:v main",
        "-crf 20",
        "-g 48",
        "-keyint_min 48",
        "-sc_threshold 0",
        "-b:v 1400k",
        "-maxrate 1498k",
        "-bufsize 2100k",
        "-f hls",
        "-hls_time 4",
        "-hls_playlist_type vod",
        `-hls_segment_filename /tmp/${id}/480p_%d.ts`,
      ])
      .output(`/tmp/${id}/480p.m3u8`)
      .run();
  });
};

module.exports = {
  handler: process480p,
};
