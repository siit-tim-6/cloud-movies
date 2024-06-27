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
        filterExpressions.push("contains(#lowerTitle, :lowerTitle)");
        expressionAttributeNames["#lowerTitle"] = "LowerTitle";
        expressionAttributeValues[":lowerTitle"] = title.toLowerCase();
    }
    if (description) {
        filterExpressions.push("contains(#lowerDescription, :lowerDescription)");
        expressionAttributeNames["#lowerDescription"] = "LowerDescription";
        expressionAttributeValues[":lowerDescription"] = description.toLowerCase();
    }
    if (actors) {
        filterExpressions.push("contains(#lowerActors, :lowerActors)");
        expressionAttributeNames["#lowerActors"] = "LowerActors";
        expressionAttributeValues[":lowerActors"] = actors.toLowerCase();
    }
    if (directors) {
        filterExpressions.push("contains(#lowerDirectors, :lowerDirectors)");
        expressionAttributeNames["#lowerDirectors"] = "LowerDirectors";
        expressionAttributeValues[":lowerDirectors"] = directors.toLowerCase();
    }
    if (genres) {
        filterExpressions.push("contains(#lowerGenre, :lowerGenre)");
        expressionAttributeNames["#lowerGenre"] = "LowerGenre";
        expressionAttributeValues[":lowerGenre"] = genres.toLowerCase();
    }

    let dynamoScanCommand;
    if (filterExpressions.length > 0) {
        const filterExpression = filterExpressions.join(" AND ");

        dynamoScanCommand = new ScanCommand({
            TableName: tableName,
            FilterExpression: filterExpression,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
        });
    } else {
        dynamoScanCommand = new ScanCommand({
            TableName: tableName,
        });
    }

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
