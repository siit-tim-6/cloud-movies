"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");

const { v4: uuidv4 } = require("uuid");
const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

exports.handler = async (event) => {
  const bucketName = process.env.S3_BUCKET;
  const tableName = process.env.DYNAMODB_TABLE;
  const { title, description, genre, actors, directors, coverFileName, coverFileType, videoFileName, videoFileType } = event;

  console.log(bucketName);
  console.log(tableName);

  const movieId = uuidv4();

  // upload to S3

  const putCoverCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: `${movieId}/cover/${coverFileName}`,
    Body: "testCover",
  });

  const putVideoCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: `${movieId}/video/${videoFileName}`,
    Body: "testVideo",
  });

  const s3CoverResponse = await s3Client.send(putCoverCommand);
  console.log(s3CoverResponse);
  const s3VideoResponse = await s3Client.send(putVideoCommand);
  console.log(s3VideoResponse);

  // put item to DynamoDB

  const dynamoPutCommand = new PutCommand({
    TableName: tableName,
    Item: {
      MovieId: movieId,
      Title: title,
      Description: description,
      Genre: genre,
      Actors: actors,
      Directors: directors,
      CoverS3Url: `https://${bucketName}.s3.amazonaws.com/${movieId}/cover/${coverFileName}`,
      VideoS3Url: `https://${bucketName}.s3.amazonaws.com/${movieId}/video/${videoFileName}`,
      CreatedAt: new Date().toISOString(),
    },
  });

  const dynamoResponse = await dynamoDocClient.send(dynamoPutCommand);
  console.log(dynamoResponse);

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    },
    body: {
      coverUploadURL: s3CoverResponse,
      videoUploadURL: s3VideoResponse,
      movieId: movieId,
    },
  };
};
