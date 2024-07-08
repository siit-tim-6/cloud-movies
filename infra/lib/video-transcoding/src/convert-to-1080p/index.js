"use strict";

const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");

const s3Client = new S3Client({});

exports.handler = async (event) => {
  const videoKey = event.key;
  const inputBucketName = process.env.S3_INPUT_BUCKET;
  const outputBucketName = process.env.S3_OUTPUT_BUCKET;

  const getObjectCommand = new GetObjectCommand({
    Bucket: inputBucketName,
    Key: videoKey,
  });

  const videoResponse = await s3Client.send(getObjectCommand);
  const stream = videoResponse.Body;
  let totalTime;
  const id = videoKey.split("/")[0];

  fs.mkdirSync(`/tmp/${id}`, { recursive: true });

  console.log("started processing");
  await ffmpegProcessing(stream, id, totalTime, outputBucketName);
  console.log("finished processing");
};

const ffmpegProcessing = (stream, id, totalTime, outputBucketName) => {
  return new Promise((resolve, reject) => {
    ffmpeg(stream)
      .on("start", () => {
        console.log(`transcoding ${id} to 1080p`);
      })
      .on("error", (err, stdout, stderr) => {
        console.log("stderr:", stderr);
        console.error(err);
        reject(new Error(err));
      })
      .on("end", async () => {
        const fileUploadPromises = fs.readdirSync(`/tmp/${id}`).map(async (file) => {
          const putObjectCommand = new PutObjectCommand({
            Bucket: outputBucketName,
            Key: `${id}/${file}`,
            Body: fs.readFileSync(`/tmp/${id}/${file}`),
          });
          console.log(`uploading ${file} to s3`);
          return await s3Client.send(putObjectCommand);
        });
        await Promise.all(fileUploadPromises); // upload output to s3
        fs.rmdirSync(`/tmp/${id}`, { recursive: true });
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
      .outputOptions([
        "-vf scale=w=1920:h=1080",
        "-c:a aac",
        "-ar 48000",
        "-b:a 192k",
        "-c:v h264",
        "-profile:v main",
        "-crf 20",
        "-g 48",
        "-keyint_min 48",
        "-sc_threshold 0",
        "-b:v 5000k",
        "-maxrate 5350k",
        "-bufsize 7500k",
        "-f hls",
        "-hls_time 4",
        "-hls_playlist_type vod",
        `-hls_segment_filename /tmp/${id}/1080p_%d.ts`,
      ])
      .output(`/tmp/${id}/1080p.m3u8`)
      .run();
  });
};
