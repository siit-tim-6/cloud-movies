"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { CognitoIdentityProviderClient, AdminGetUserCommand } = require("@aws-sdk/client-cognito-identity-provider");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({});
const sqsClient = new SQSClient({});

exports.handler = async (event) => {
  const tableName = process.env.DYNAMODB_TABLE;
  const userPoolId = process.env.COGNITO_USER_POOL_ID.split("/").pop();
  const sqsQueueUrl = process.env.SQS_QUEUE_URL;
  const { subscribedTo } = JSON.parse(event.body);
  const { Authorization } = event.headers;

  // Decode the user ID from the Authorization header
  const userId = JSON.parse(Buffer.from(Authorization.split(".")[1], "base64").toString()).sub;
  const username = JSON.parse(Buffer.from(Authorization.split(".")[1], "base64").toString()).username;

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
    Username: username,
  });

  console.log("Getting user email...");
  const userResponse = await cognitoClient.send(userCommand);
  const userEmail = userResponse.UserAttributes.find(attr => attr.Name === "email").Value;

  const sqsMessage = {
    topicName: subscribedTo,
    email: userEmail,
  }

  // Send a message to the SQS queue
  const sqsParams = {
    QueueUrl: sqsQueueUrl,
    MessageBody: JSON.stringify(sqsMessage),
  };

  console.log("Sending message to SQS...");
  const sqsCommand = new SendMessageCommand(sqsParams);
  await sqsClient.send(sqsCommand);

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
