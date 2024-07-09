"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { QueryCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
    const tableName = process.env.RATINGS_TABLE;
    const userId = event.userId;

    const dynamoQueryCommand = new QueryCommand({
        TableName: tableName,
        IndexName: 'UserIdIndex',
        KeyConditionExpression: "UserId = :userId",
        ExpressionAttributeValues: {
            ":userId": userId,
        },
    });

    const ratingsResponse = await dynamoDocClient.send(dynamoQueryCommand);
    const ratingsList = ratingsResponse.Items.map((rating) => ({
        movieId: rating.MovieId,
        rating: rating.Rating,
    }));

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Headers": "Origin,Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
            "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(ratingsList),
    };
};
