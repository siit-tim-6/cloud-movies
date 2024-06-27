"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { GetCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { GetObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

exports.handler = async (event) => {
    const bucketName = process.env.S3_BUCKET;
    const tableName = process.env.DYNAMODB_TABLE;
    const movieId = event["queryStringParameters"]['movieId'];

    console.log(bucketName);
    console.log(tableName);
    console.log(movieId);

    const dynamoGetCommand = new GetCommand({
        TableName: tableName,
        Key: {
            MovieId: movieId,
        },
    });

    const movie = await dynamoDocClient.send(dynamoGetCommand);
    console.log(movie);

    if (!movie.Item) {
        return {
            statusCode: 404,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET,OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            },
            body: JSON.stringify({ message: "Movie not found" }),
        };
    }

    const videoS3Url = movie.Item.VideoS3Url;
    const s3Key = videoS3Url.split(`https://${bucketName}.s3.amazonaws.com/`)[1];

    const getObjectCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
    });

    const signedUrl = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 });
    console.log(signedUrl);

    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        },
        body: JSON.stringify({ downloadUrl: signedUrl }),
    };
};
