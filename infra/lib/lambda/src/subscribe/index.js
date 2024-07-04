"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { CognitoIdentityProviderClient, AdminGetUserCommand } = require("@aws-sdk/client-cognito-identity-provider");
const { SNSClient, SubscribeCommand, CreateTopicCommand, ListTopicsCommand } = require("@aws-sdk/client-sns");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({});
const snsClient = new SNSClient({});

exports.handler = async (event) => {
  const tableName = process.env.DYNAMODB_TABLE;
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const { subscribedTo } = JSON.parse(event.body);
  const { Authorization } = event.headers;

  // Decode the user ID from the Authorization header
  const userId = JSON.parse(Buffer.from(Authorization.split(".")[1], "base64").toString()).sub;

  // Store the subscription preferences in DynamoDB
  const dynamoPutCommand = new PutCommand({
    TableName: tableName,
    Item: {
      UserId: userId,
      SubscribedTo: subscribedTo,
    },
  });

  await dynamoDocClient.send(dynamoPutCommand);

  // Get the user's email from Cognito
  const userCommand = new AdminGetUserCommand({
    UserPoolId: userPoolId,
    Username: userId,
  });

  const userResponse = await cognitoClient.send(userCommand);
  const userEmail = userResponse.UserAttributes.find(attr => attr.Name === "email").Value;

  console.log("User email: ", userEmail);

  // Ensure the topic name is valid
  const topicName = subscribedTo.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  let topicArn;

  // Check if the topic already exists
  const listTopicsCommand = new ListTopicsCommand({});
  const listTopicsResponse = await snsClient.send(listTopicsCommand);
  const existingTopic = listTopicsResponse.Topics.find(topic => topic.TopicArn.endsWith(`:${topicName}`));

  if (existingTopic) {
    topicArn = existingTopic.TopicArn;
  } else {
    // Create the SNS topic
    const createTopicCommand = new CreateTopicCommand({ Name: topicName });
    const createTopicResponse = await snsClient.send(createTopicCommand);
    topicArn = createTopicResponse.TopicArn;
  }

  // Subscribe the user's email to the SNS topic
  const subscribeCommand = new SubscribeCommand({
    Protocol: "email",
    TopicArn: topicArn,
    Endpoint: userEmail,
  });

  await snsClient.send(subscribeCommand);

  return {
    statusCode: 201,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Headers": "Origin,Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Origin": "*",
    },
    body: event.body,
  };
};
