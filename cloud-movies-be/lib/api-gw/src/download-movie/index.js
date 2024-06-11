"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { GetCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { GetObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

exports.handler = async (event) => {
  const bucketName = process.env.S3_BUCKET;
  const tableName = process.env.DYNAMODB_TABLE;
  const movieId = event.queryStringParameters.movieId;

  // // get item from DynamoDB

  const dynamoGetCommand = new GetCommand({
    TableName: tableName,
    Key: {
      MovieId: movieId,
    },
  });

  const dynamoResponse = await dynamoDocClient.send(dynamoGetCommand);

  // get from S3

  // const getVideoCommand = new GetObjectCommand({
  //   Bucket: bucketName,
  //   Key: `${movieId}/video/${videoFileName}`,
  // });

  // const s3VideoSignedUrl = await getSignedUrl(s3Client, getVideoCommand, { expiresIn: 3600 });

  return {
    videoDownloadURL: "test",
    movieId: movieId,
    // dynamoResponse: dynamoResponse,
  };
};
