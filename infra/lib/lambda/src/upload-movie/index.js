"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const { PublishCommand, SNSClient, CreateTopicCommand, ListTopicsCommand } = require("@aws-sdk/client-sns");

const { v4: uuidv4 } = require("uuid");
const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});
const snsClient = new SNSClient({});

exports.handler = async (event) => {
  const bucketName = process.env.S3_BUCKET;
  const tableName = process.env.DYNAMODB_TABLE;
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
      CoverS3Url: `https://${bucketName}.s3.amazonaws.com/${movieId}/cover/${coverFileName}`,
      VideoS3Url: `https://${bucketName}.s3.amazonaws.com/${movieId}/video/${videoFileName}`,
      CreatedAt: new Date().toISOString(),
    },
  });

  const dynamoResponse = await dynamoDocClient.send(dynamoPutCommand);
  console.log(dynamoResponse);

  // Check if SNS topic exists, if not create it
  const actorName = actorsLower[0]; // Assuming you want to notify about the first actor
  const topicName = `${actorName.replace(/\s/g, "-")}`
  let topicArn;

  try {
    const listTopicsCommand = new ListTopicsCommand({});
    const listTopicsResponse = await snsClient.send(listTopicsCommand);
    const existingTopic = listTopicsResponse.Topics.find(topic => topic.TopicArn.split(':').pop() === topicName);

    if (existingTopic) {
      topicArn = existingTopic.TopicArn;
    } else {
      const createTopicCommand = new CreateTopicCommand({ Name: topicName });
      const createTopicResponse = await snsClient.send(createTopicCommand);
      topicArn = createTopicResponse.TopicArn;
    }

    // Publish to SNS topic
    const publishCommand = new PublishCommand({
      TopicArn: topicArn,
      Message: `A new movie titled "${title}" featuring ${actorName} has been released.`,
      Subject: "New Movie Release",
    });

    await snsClient.send(publishCommand);
  } catch (error) {
    console.error("Error handling SNS topic:", error);
    throw error;
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
