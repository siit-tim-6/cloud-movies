"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, DeleteCommand, QueryCommand  } = require("@aws-sdk/lib-dynamodb");
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});
const sqsClient = new SQSClient({});

exports.handler = async (event) => {
  const { id } = event.pathParameters;
  const tableName = process.env.DYNAMODB_TABLE;
  const bucketName = process.env.S3_BUCKET;
  const ratingsTableName = process.env.MOVIE_RATINGS_TABLE;
  const downloadsTableName = process.env.DOWNLOADS_TABLE;
  const queueUrl = process.env.FEED_UPDATE_QUEUE_URL;

  // Fetch movie details from DynamoDB to get the S3 keys
  const getParams = {
    TableName: tableName,
    Key: { MovieId: id },
  };

  const movie = await dynamoDocClient.send(new GetCommand(getParams));

  if (!movie.Item) {
    return {
      statusCode: 404,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Headers": "Origin,Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Access-Control-Allow-Origin": "*",
      },
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

  const ratingsQueryParams = {
    TableName: ratingsTableName,
    KeyConditionExpression: "MovieId = :movieId",
    ExpressionAttributeValues: {
      ":movieId": id,
    },
  };

  const ratings = await dynamoDocClient.send(new QueryCommand(ratingsQueryParams));
  const deleteRatingsPromises = ratings.Items.map((item) => {
    const deleteRatingParams = {
      TableName: ratingsTableName,
      Key: {
        MovieId: item.MovieId,
        UserId: item.UserId,
      },
    };
    return dynamoDocClient.send(new DeleteCommand(deleteRatingParams));
  });

  await Promise.all(deleteRatingsPromises);

  const downloadsQueryParams = {
    TableName: downloadsTableName,
    IndexName: "MovieId-index",
    KeyConditionExpression: "MovieId = :movieId",
    ExpressionAttributeValues: {
      ":movieId": id,
    },
  };

  const downloads = await dynamoDocClient.send(new QueryCommand(downloadsQueryParams));
  const deleteDownloadsPromises = downloads.Items.map((item) => {
    const deleteDownloadParams = {
      TableName: downloadsTableName,
      Key: {
        MovieId: item.MovieId,
        UserId: item.UserId,
      },
    };
    return dynamoDocClient.send(new DeleteCommand(deleteDownloadParams));
  });

  await Promise.all(deleteDownloadsPromises);

  const sqsMessage = {
    eventType: "delete",
  };

  const sqsParams = {
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(sqsMessage),
  };

  await sqsClient.send(new SendMessageCommand(sqsParams));

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
