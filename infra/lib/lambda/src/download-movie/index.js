"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, GetCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { GetObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

exports.handler = async (event) => {
  const bucketName = process.env.S3_BUCKET;
  const tableName = process.env.DYNAMODB_TABLE;
  const movieId = event.queryStringParameters.movieId;
  const downloadsTableName = process.env.DOWNLOADS_TABLE;
  const userId = JSON.parse(Buffer.from(event.headers.Authorization.split('.')[1], 'base64').toString()).sub;

  // // get item from DynamoDB

  const dynamoGetCommand = new GetCommand({
    TableName: tableName,
    Key: {
      MovieId: movieId,
    },
  });

  const movieResponse = await dynamoDocClient.send(dynamoGetCommand);
  console.log(movieResponse);

  if (!movieResponse.Item) {
    return {
      statusCode: 404,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      },
      body: JSON.stringify({ message: "Movie not found" }),
    };
  }

  const videoS3Url = movieResponse.Item.VideoS3Url;
  const s3Key = videoS3Url.split(`https://${bucketName}.s3.amazonaws.com/`)[1];

  // get from S3

  const getVideoCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
    ResponseContentDisposition: "attachment",
  });

  const s3VideoSignedUrl = await getSignedUrl(s3Client, getVideoCommand, { expiresIn: 3600 });

  const dynamoPutCommand = new PutCommand({
    TableName: downloadsTableName,
    Item: {
      UserId: userId,
      MovieId: movieId,
      DownloadedAt: new Date().toISOString(),
    },
  });

  await dynamoDocClient.send(dynamoPutCommand);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Headers": "Origin,Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      downloadUrl: s3VideoSignedUrl,
    }),
  };
};
