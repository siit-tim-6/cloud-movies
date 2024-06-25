"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

exports.handler = async (event) => {
  const { id } = event.pathParameters;
  const tableName = process.env.DYNAMODB_TABLE;
  const bucketName = process.env.S3_BUCKET;

  // Fetch movie details from DynamoDB to get the S3 keys
  const getParams = {
    TableName: tableName,
    Key: { MovieId: id },
  };

  const movie = await dynamoDocClient.send(new GetCommand(getParams));

  if (!movie.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "Movie not found" }),
    };
  }

  const { CoverS3Url, VideoS3Url } = movie.Item;

  // Delete movie from DynamoDB
  const deleteParams = {
    TableName: tableName,
    Key: { MovieId: id },
  };

  await dynamoDocClient.send(new DeleteCommand(deleteParams));

  // Delete cover and video from S3
  const coverKey = CoverS3Url.split("/").slice(-3).join("/");
  const videoKey = VideoS3Url.split("/").slice(-3).join("/");

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: coverKey,
    })
  );

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: videoKey,
    })
  );

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Headers": "Origin,Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({ message: "Movie deleted successfully" }),
  };
};
