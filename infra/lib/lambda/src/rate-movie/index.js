"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, QueryCommand, UpdateCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
const sqsClient = new SQSClient({});

exports.handler = async (event) => {
    const tableName = process.env.MOVIE_RATINGS_TABLE;
    const { movieId, rating } = JSON.parse(event.body);
    const { Authorization } = event.headers;
    const queueUrl = process.env.FEED_UPDATE_QUEUE_URL;

    const userId = JSON.parse(Buffer.from(Authorization.split(".")[1], "base64").toString()).sub;

    const queryCommand = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "MovieId = :movieId AND UserId = :userId",
        ExpressionAttributeValues: {
            ":movieId": movieId,
            ":userId": userId,
        },
    });

    const { Items } = await dynamoDocClient.send(queryCommand);
    const existingRating = Items.length > 0 ? Items[0].Rating : null;

    if (existingRating !== null) {
        const updateCommand = new UpdateCommand({
            TableName: tableName,
            Key: {
                MovieId: movieId,
                UserId: userId,
            },
            UpdateExpression: "set Rating = :rating",
            ExpressionAttributeValues: {
                ":rating": rating,
            },
        });
        await dynamoDocClient.send(updateCommand);
    } else {
        const putCommand = new PutCommand({
            TableName: tableName,
            Item: {
                MovieId: movieId,
                UserId: userId,
                Rating: rating,
            },
        });
        await dynamoDocClient.send(putCommand);
    }

    const allRatingsQueryCommand = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "MovieId = :movieId",
        ExpressionAttributeValues: {
            ":movieId": movieId,
        },
    });

    const allRatingsResult = await dynamoDocClient.send(allRatingsQueryCommand);
    const totalRatings = allRatingsResult.Items.length;
    const sumRatings = allRatingsResult.Items.reduce((sum, item) => sum + item.Rating, 0);
    const averageRating = sumRatings / totalRatings;

    const sqsMessage = {
        userId: userId,
        eventType: "rating",
    };

    const sqsParams = {
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(sqsMessage),
    };

    await sqsClient.send(new SendMessageCommand(sqsParams));

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Headers": "Origin,Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
            "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ averageRating }),
    };
};
