"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  const tableName = process.env.DYNAMODB_TABLE;
  const { subscribedTo } = JSON.parse(event.body);
  const { Authorization } = event.headers;

  const userId = JSON.parse(Buffer.from(Authorization.split(".")[1], "base64").toString()).sub;

  const dynamoPutCommand = new PutCommand({
    TableName: tableName,
    Item: {
      UserId: userId,
      SubscribedTo: subscribedTo,
    },
  });

  await dynamoDocClient.send(dynamoPutCommand);

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
