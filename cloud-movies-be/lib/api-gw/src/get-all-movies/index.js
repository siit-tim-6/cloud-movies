"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { ScanCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  const tableName = process.env.DYNAMODB_TABLE;

  const dynamoScanCommand = new ScanCommand({
    TableName: tableName,
  });

  const moviesReponse = await dynamoDocClient.send(dynamoScanCommand);

  return {
    statusCode: 200,
    body: JSON.stringify(moviesReponse.Items),
  };
};
