"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const { v4: uuidv4 } = require("uuid");
const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

exports.handler = async (event) => {
  const bucketName = process.env.S3_BUCKET;
  const tableName = process.env.DYNAMODB_TABLE;
  const { title, description, genre, actors, directors, coverFileName, coverFileType, videoFileName, videoFileType } = JSON.parse(event.body);

  const movieId = uuidv4();

  // upload to S3

  const putCoverCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: `${movieId}/cover/${coverFileName}`,
    ContentType: coverFileType,
  });

  const putVideoCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: `${movieId}/video/${videoFileName}`,
    ContentType: videoFileType,
  });

  const s3CoverSignedUrl = await getSignedUrl(s3Client, putCoverCommand, { expiresIn: 3600 });
  const s3VideoSignedUrl = await getSignedUrl(s3Client, putVideoCommand, { expiresIn: 3600 });

  // put item to DynamoDB

  const dynamoPutCommand = new PutCommand({
    TableName: tableName,
    Item: {
      MovieId: movieId,
      Title: title,
      LowerTitle: title.toLowerCase(),
      Description: description,
      LowerDescription: description.toLowerCase(),
      Genre: genre,
      LowerGenre: genre.toLowerCase(),
      Actors: actors,
      LowerActors: actors.toLowerCase(),
      Directors: directors,
      LowerDirectors: directors.toLowerCase(),
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
      "Content-Type": "application/json",
      "Access-Control-Allow-Headers": "Origin,Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      coverUploadURL: s3CoverSignedUrl,
      videoUploadURL: s3VideoSignedUrl,
      movieId: movieId,
    }),
  };
};