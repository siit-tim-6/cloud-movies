"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { ScanCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { GetObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

exports.handler = async (event) => {
  const tableName = process.env.DYNAMODB_TABLE;
  const bucketName = process.env.S3_BUCKET;

  const dynamoScanCommand = new ScanCommand({
    TableName: tableName,
    ProjectionExpression: "MovieId, Title, Genres, CoverS3Url",
  });

  const moviesResponse = await dynamoDocClient.send(dynamoScanCommand);

  const moviesWithCoverPromises = moviesResponse.Items.map(async (item) => {
    const s3CoverUrlKey = item.CoverS3Url.split(`https://${bucketName}.s3.amazonaws.com/`)[1];
    const getCoverCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3CoverUrlKey,
    });
    const s3CoverSignedUrl = await getSignedUrl(s3Client, getCoverCommand, { expiresIn: 3600 });

    return {
      MovieId: item.MovieId,
      Title: item.Title,
      Genres: item.Genres,
      CoverS3Url: s3CoverSignedUrl,
    };
  });

  const responseBody = await Promise.all(moviesWithCoverPromises);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Headers": "Origin,Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(responseBody),
  };
};
