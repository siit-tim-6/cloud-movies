"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, BatchGetCommand } = require("@aws-sdk/lib-dynamodb");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
const sqsClient = new SQSClient({});
const s3Client = new S3Client({});

exports.handler = async (event) => {
    const feedsTableName = process.env.FEEDS_TABLE;
    const moviesTableName = process.env.MOVIES_TABLE;
    const feedQueueUrl = process.env.FEED_QUEUE_URL;
    const bucketName = process.env.S3_BUCKET;
    const userId = JSON.parse(Buffer.from(event.headers.Authorization.split('.')[1], 'base64').toString()).sub;
    console.log("UserId:"+userId);
    try {
        const getFeedCommand = new GetCommand({
            TableName: feedsTableName,
            Key: { UserId: userId },
        });

        const feedResponse = await dynamoDocClient.send(getFeedCommand);

        if (!feedResponse.Item || !feedResponse.Item.Feed) {
            const sqsMessage = {
                userId: userId,
                eventType: "generateFeed",
            };

            const sqsParams = {
                QueueUrl: feedQueueUrl,
                MessageBody: JSON.stringify(sqsMessage),
            };

            try {
                await sqsClient.send(new SendMessageCommand(sqsParams));
                console.log(`Sent message to SQS to generate feed for user: ${userId}`);
            } catch (err) {
                console.error(`Failed to send message to SQS: ${err}`);
            }

            return {
                statusCode: 200,
                body: JSON.stringify([]),
            };
        }

        const movieIds = feedResponse.Item.Feed;

        console.log("MovieIds:"+movieIds);
        const batchGetCommand = new BatchGetCommand({
            RequestItems: {
                [moviesTableName]: {
                    Keys: movieIds.map((movieId) => ({ MovieId: movieId })),
                },
            },
        });

        const movieResponse = await dynamoDocClient.send(batchGetCommand);

        const movies = movieResponse.Responses[moviesTableName];

        const moviesWithSignedUrls = await Promise.all(movies.map(async (movie) => {
            const s3CoverUrlKey = movie.CoverS3Url.split(`https://${bucketName}.s3.amazonaws.com/`)[1];
            const getCoverCommand = new GetObjectCommand({
                Bucket: bucketName,
                Key: s3CoverUrlKey,
            });
            const s3CoverSignedUrl = await getSignedUrl(s3Client, getCoverCommand, { expiresIn: 3600 });
            movie.CoverS3Url = s3CoverSignedUrl;

            return movie;
        }));

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET,OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            },
            body: JSON.stringify(moviesWithSignedUrls),
        };
    } catch (error) {
        console.error("Error fetching movies:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" }),
        };
    }
};
