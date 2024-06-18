"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { ScanCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
    const tableName = process.env.DYNAMODB_TABLE;
    const { title, description, actors, directors, genres } = JSON.parse(event.body);

    const filterExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    if (title) {
        filterExpressions.push("contains(#title, :title)");
        expressionAttributeNames["#title"] = "Title";
        expressionAttributeValues[":title"] = title;
    }
    if (description) {
        filterExpressions.push("contains(#description, :description)");
        expressionAttributeNames["#description"] = "Description";
        expressionAttributeValues[":description"] = description;
    }
    if (actors) {
        filterExpressions.push("contains(#actors, :actors)");
        expressionAttributeNames["#actors"] = "Actors";
        expressionAttributeValues[":actors"] = actors;
    }
    if (directors) {
        filterExpressions.push("contains(#directors, :directors)");
        expressionAttributeNames["#directors"] = "Directors";
        expressionAttributeValues[":directors"] = directors;
    }
    if (genres) {
        filterExpressions.push("contains(#genres, :genres)");
        expressionAttributeNames["#genres"] = "Genres";
        expressionAttributeValues[":genres"] = genres;
    }

    const filterExpression = filterExpressions.join(" AND ");

    const dynamoScanCommand = new ScanCommand({
        TableName: tableName,
        FilterExpression: filterExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
    });

    const moviesResponse = await dynamoDocClient.send(dynamoScanCommand);

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
