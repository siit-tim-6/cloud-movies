"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { QueryCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { GetObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

exports.handler = async (event) => {
  const tableName = process.env.DYNAMODB_TABLE;
  const bucketName = process.env.S3_BUCKET;
  const movieId = event.pathParameters.id;

  const dynamoQueryCommand = new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "MovieId = :movieId",
    ExpressionAttributeValues: {
      ":movieId": movieId,
    },
  });

  const movieResponse = await dynamoDocClient.send(dynamoQueryCommand);

  if (movieResponse.Count < 1) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Headers": "Origin,Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Movie not found" }),
    };
  }

  const responseItem = movieResponse.Items[0];

  const s3CoverUrlKey = responseItem.CoverS3Url.split(`https://${bucketName}.s3.amazonaws.com/`)[1];
  const getCoverCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: s3CoverUrlKey,
  });
  const s3CoverSignedUrl = await getSignedUrl(s3Client, getCoverCommand, { expiresIn: 3600 });
  responseItem.CoverS3Url = s3CoverSignedUrl;

  const s3VideoUrlKey = responseItem.VideoS3Url.split(`https://${bucketName}.s3.amazonaws.com/`)[1];
  const getVideoCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: s3VideoUrlKey,
  });
  const s3VideoSignedUrl = await getSignedUrl(s3Client, getVideoCommand, { expiresIn: 3600 });
  responseItem.VideoS3Url = s3VideoSignedUrl;


  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Headers": "Origin,Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(responseItem),
  };
};
