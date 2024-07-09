"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { QueryCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  const tableName = process.env.DYNAMODB_TABLE;
  let userId;

  if (event.headers && event.headers.Authorization) {
    try {
      userId = JSON.parse(Buffer.from(event.headers.Authorization.split(".")[1], "base64").toString()).sub;
    } catch (error) {
      console.error("Failed to parse Authorization header:", error);
      userId = event.userId;
    }
  } else {
    userId = event.userId;
  }

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
