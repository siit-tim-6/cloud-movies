"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { QueryCommand, ScanCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  const tableName = process.env.DYNAMODB_TABLE;
  if (event.queryStringParameters === null) {
    event.queryStringParameters = {};
  }
  const { title, description, actor, director, genre } = event?.queryStringParameters;

  const filterExpressions = [];
  const expressionAttributeValues = {};

  if (actor) {
    filterExpressions.push("contains(Actors, :actor)");
    expressionAttributeValues[":actor"] = actor.toLowerCase();
  }

  if (director) {
    filterExpressions.push("contains(Directors, :director)");
    expressionAttributeValues[":director"] = director.toLowerCase();
  }

  if (genre) {
    filterExpressions.push("contains(Genres, :genre)");
    expressionAttributeValues[":genre"] = genre.toLowerCase();
  }

  let dynamoCommandProps = {
    TableName: tableName,
    ProjectionExpression: "MovieId, Title, Genres, CoverS3Url",
  };

  if (title && description) {
    dynamoCommandProps["IndexName"] = "titleSearch";
    dynamoCommandProps["KeyConditionExpression"] = "LowerTitle = :title AND begins_with(LowerDescription, :description)";
    expressionAttributeValues[":title"] = title.toLowerCase();
    expressionAttributeValues[":description"] = description.toLowerCase();
  } else if (title) {
    dynamoCommandProps["IndexName"] = "titleSearch";
    dynamoCommandProps["KeyConditionExpression"] = "LowerTitle = :title";
    expressionAttributeValues[":title"] = title.toLowerCase();
  } else if (description) {
    dynamoCommandProps["IndexName"] = "descriptionSearch";
    dynamoCommandProps["KeyConditionExpression"] = "LowerDescription = :description";
    expressionAttributeValues[":description"] = description.toLowerCase();
  }

  dynamoCommandProps["ExpressionAttributeValues"] = expressionAttributeValues;
  if (filterExpressions.length > 0) {
    dynamoCommandProps["FilterExpression"] = filterExpressions.join(" AND ");
  }

  console.log(dynamoCommandProps);

  const dynamoCommand = title || description ? new QueryCommand(dynamoCommandProps) : new ScanCommand(dynamoCommandProps);
  const moviesResponse = await dynamoDocClient.send(dynamoCommand);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Headers": "Origin,Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(moviesResponse.Items),
  };
};
