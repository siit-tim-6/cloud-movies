"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

const { v4: uuidv4 } = require("uuid");
const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});
const sqsClient = new SQSClient({});

exports.handler = async (event) => {
  const bucketName = process.env.S3_BUCKET;
  const tableName = process.env.DYNAMODB_TABLE;
  const sqsQueueUrl = process.env.SQS_QUEUE_URL;
  const { title, description, genres, actors, directors, coverFileName, coverFileType, videoFileName, videoFileType } = JSON.parse(event.body);

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

  const genresLower = genres.map((genre) => genre.toLowerCase());
  const actorsLower = actors.map((actor) => actor.toLowerCase());
  const directorsLower = directors.map((director) => director.toLowerCase());
  const everythingSearch = [title.toLowerCase(), description.toLowerCase(), actorsLower.join(","), directorsLower.join(","), genresLower.join(",")].join("#");

  const dynamoPutCommand = new PutCommand({
    TableName: tableName,
    Item: {
      MovieId: movieId,
      Title: title,
      LowerTitle: title.toLowerCase(),
      Description: description,
      LowerDescription: description.toLowerCase(),
      Genres: genresLower,
      Actors: actorsLower,
      Directors: directorsLower,
      EverythingSearch: everythingSearch,
      CoverS3Url: `https://${bucketName}.s3.amazonaws.com/${movieId}/cover/${coverFileName}`,
      VideoS3Url: `https://${bucketName}.s3.amazonaws.com/${movieId}/video/${videoFileName}`,
      CreatedAt: new Date().toISOString(),
    },
  });

  const dynamoResponse = await dynamoDocClient.send(dynamoPutCommand);
  console.log(dynamoResponse);

  const topics = genresLower.concat(actorsLower, directorsLower);
  console.log(topics);
  console.log(`SQS Queue URL: ${sqsQueueUrl}`);
  for (const topic of topics) {
    const sqsMessage = {
      topicName: topic,
      movieId,
      movieTitle: title,
    };

    const sqsParams = {
      QueueUrl: sqsQueueUrl,
      MessageBody: JSON.stringify(sqsMessage),
    };

    const sqsCommand = new SendMessageCommand(sqsParams);
    await sqsClient.send(sqsCommand);
  }

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
