"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { QueryCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  const tableName = process.env.DYNAMODB_TABLE;
  const { Authorization } = event.headers;

  const userId = JSON.parse(Buffer.from(Authorization.split(".")[1], "base64").toString()).sub;

  const dynamoQueryCommand = new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "UserId = :userId",
    ExpressionAttributeValues: {
      ":userId": userId,
    },
  });

  const subscriptionsResponse = await dynamoDocClient.send(dynamoQueryCommand);
  const subscriptionsList = subscriptionsResponse.Items.map((subscription) => {
    const [type, value] = subscription.SubscribedTo.split(':');
    return { type, value };
  });

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Headers": "Origin,Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(subscriptionsList),
  };
};
