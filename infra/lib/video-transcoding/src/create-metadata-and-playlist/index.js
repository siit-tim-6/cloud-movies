"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

exports.handler = async (event) => {
  const outputBucketName = process.env.S3_OUTPUT_BUCKET;
  const statusTable = process.env.STATUS_TABLE;
  const { key } = event;
  const id = key.split("/")[0];

  const dynamoPutCommand = new PutCommand({
    TableName: statusTable,
    Item: {
      MovieId: id,
      Status: "PROCESSING",
    },
  });

  const content = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
360p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=842x480
480p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p.m3u8`;
  const s3PutObjectCommand = new PutObjectCommand({
    Bucket: outputBucketName,
    Key: `${id}/index.m3u8`,
    Body: content,
  });

  await dynamoDocClient.send(dynamoPutCommand);
  await s3Client.send(s3PutObjectCommand);

  console.log("Successfully written index playlist to s3");

  return { id };
};
