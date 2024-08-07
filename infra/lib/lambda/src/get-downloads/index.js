"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { QueryCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
    const tableName = process.env.DOWNLOADS_TABLE;
    const userId = event.userId;

    const dynamoQueryCommand = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "UserId = :userId",
        ExpressionAttributeValues: {
            ":userId": userId,
        },
    });

    const downloadsResponse = await dynamoDocClient.send(dynamoQueryCommand);
    const downloadsList = downloadsResponse.Items.map((download) => ({
        movieId: download.MovieId,
        downloadedAt: download.DownloadedAt,
    }));

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Headers": "Origin,Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
            "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(downloadsList),
    };
};
