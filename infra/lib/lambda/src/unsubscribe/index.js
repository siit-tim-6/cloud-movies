"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DeleteCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const { CognitoIdentityProviderClient, AdminGetUserCommand } = require("@aws-sdk/client-cognito-identity-provider");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({});
const sqsClient = new SQSClient({});

exports.handler = async (event) => {
  const tableName = process.env.DYNAMODB_TABLE;
  const queueUrl = process.env.SQS_QUEUE_URL;
  const userPoolId = process.env.COGNITO_USER_POOL_ID.split("/").pop();
  const { subscribedTo } = event.queryStringParameters;
  const { Authorization } = event.headers;

  const userId = JSON.parse(Buffer.from(Authorization.split(".")[1], "base64").toString()).sub;
  const username = JSON.parse(Buffer.from(Authorization.split(".")[1], "base64").toString()).username;

  const dynamoDeleteCommand = new DeleteCommand({
    TableName: tableName,
    Key: {
      UserId: userId,
      SubscribedTo: subscribedTo,
    },
  });

  await dynamoDocClient.send(dynamoDeleteCommand);

  const userCommand = new AdminGetUserCommand({
    UserPoolId: userPoolId,
    Username: username,
  });

  const userResponse = await cognitoClient.send(userCommand);
  const userEmail = userResponse.UserAttributes.find(attr => attr.Name === "email").Value;

  const sqsSendMessageCommand = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify({
      topicName: subscribedTo,
      email: userEmail,
      unsubscribe: true,
    }),
  });

  await sqsClient.send(sqsSendMessageCommand);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Headers": "Origin,Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Origin": "*",
    },
  };
};
