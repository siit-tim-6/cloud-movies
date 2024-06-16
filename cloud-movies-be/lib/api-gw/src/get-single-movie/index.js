"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { QueryCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  const tableName = process.env.DYNAMODB_TABLE;
  const movieId = event.pathParameters.id;

  const dynamoScanCommand = new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "MovieId = :movieId",
    ExpressionAttributeValues: {
      ":movieId": movieId,
    },
  });

  const movieResponse = await dynamoDocClient.send(dynamoScanCommand);

  if (movieResponse.Count < 1) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Headers": "Origin,Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Movie not found" }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Headers": "Origin,Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(movieResponse.Items[0]),
  };
};
