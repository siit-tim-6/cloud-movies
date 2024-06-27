"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DeleteCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  const tableName = process.env.DYNAMODB_TABLE;
  const { subscribedTo } = event.queryStringParameters;
  const { Authorization } = event.headers;

  const userId = JSON.parse(Buffer.from(Authorization.split(".")[1], "base64").toString()).sub;

  const dynamoDeleteCommand = new DeleteCommand({
    TableName: tableName,
    Key: {
      UserId: userId,
      SubscribedTo: subscribedTo,
    },
  });

  await dynamoDocClient.send(dynamoDeleteCommand);

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
