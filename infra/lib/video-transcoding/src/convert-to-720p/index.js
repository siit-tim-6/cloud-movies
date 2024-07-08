const S3 = require("aws-sdk/clients/s3");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");

const s3 = new S3({
  region: "eu-central-1",
});

const process720p = (event) => {
  const videoKey = event.key;
  const inputBucketName = process.env.S3_INPUT_BUCKET;
  const outputBucketName = process.env.S3_OUTPUT_BUCKET;
  const id = videoKey.split("/")[0];
  const filename = videoKey.split("/")[3];
  const params = { Bucket: inputBucketName, Key: videoKey };
  var totalTime;
  const downloadFile = `/tmp/${id}/${filename}`;

  fs.mkdirSync(`/tmp/${id}`, { recursive: true });

  const file = fs.createWriteStream(downloadFile);
  s3.getObject(params).createReadStream().pipe(file);

  ffmpeg(downloadFile)
    .on("start", () => {
      console.log(`transcoding ${id} to 720p`);
    })
    .on("error", (err, stdout, stderr) => {
      console.log("stderr:", stderr);
      console.error(err);
    })
    .on("end", async () => {
      const fileUploadPromises = fs.readdirSync(`/tmp/${id}`).map((file) => {
        let params = { Bucket: outputBucketName, Key: `${id}/${file}`, Body: fs.readFileSync(`/tmp/${id}/${file}`) };
        console.log(`uploading ${file} to s3`);
        return s3.putObject(params).promise();
      });
      await Promise.all(fileUploadPromises);
      await fs.rmdirSync(`/tmp/${id}`, { recursive: true });
      console.log(`tmp is deleted!`);
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
      "-vf scale=w=1280:h=720",
      "-c:a aac",
      "-ar 48000",
      "-b:a 128k",
      "-c:v h264",
      "-profile:v main",
      "-crf 20",
      "-g 48",
      "-keyint_min 48",
      "-sc_threshold 0",
      "-b:v 2800k",
      "-maxrate 2996k",
      "-bufsize 4200k",
      "-f hls",
      "-hls_time 4",
      "-hls_playlist_type vod",
      `-hls_segment_filename /tmp/${id}/720p_%d.ts`,
    ])
    .output(`/tmp/${id}/720p.m3u8`)
    .run();
};

module.exports = {
  handler: process720p,
};
