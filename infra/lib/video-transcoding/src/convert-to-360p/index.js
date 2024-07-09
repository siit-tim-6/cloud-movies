"use strict";

const { GetObjectCommand, S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const fsPromises = fs.promises;

const s3Client = new S3Client();

const process360p = async (event) => {
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
        console.log(`transcoding ${id} to 360p`);
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
        await Promise.all(fileUploadPromises); // upload output to s3
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
        "-vf scale=w=640:h=360",
        "-c:a aac",
        "-ar 48000",
        "-b:a 96k",
        "-c:v h264",
        "-profile:v main",
        "-crf 20",
        "-g 48",
        "-keyint_min 48",
        "-sc_threshold 0",
        "-b:v 800k",
        "-maxrate 856k",
        "-bufsize 1200k",
        "-f hls",
        "-hls_time 4",
        "-hls_playlist_type vod",
        `-hls_segment_filename /tmp/${id}/360p_%d.ts`,
      ])
      .output(`/tmp/${id}/360p.m3u8`) // output files are temporarily stored in tmp directory
      .run();
  });
};

module.exports = {
  handler: process360p,
};
