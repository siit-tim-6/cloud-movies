"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { UpdateCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

exports.handler = async (event) => {
    const bucketName = process.env.S3_BUCKET;
    const tableName = process.env.DYNAMODB_TABLE;
    const movieId = event.pathParameters.id;
    const { title, description, genres, actors, directors, coverFileName, coverFileType, videoFileName, videoFileType } = JSON.parse(event.body);

    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    if (title) {
        updateExpressions.push("#title = :title, #lowerTitle = :lowerTitle");
        expressionAttributeNames["#title"] = "Title";
        expressionAttributeNames["#lowerTitle"] = "LowerTitle";
        expressionAttributeValues[":title"] = title;
        expressionAttributeValues[":lowerTitle"] = title.toLowerCase();
    }
    if (description) {
        updateExpressions.push("#description = :description, #lowerDescription = :lowerDescription");
        expressionAttributeNames["#description"] = "Description";
        expressionAttributeNames["#lowerDescription"] = "LowerDescription";
        expressionAttributeValues[":description"] = description;
        expressionAttributeValues[":lowerDescription"] = description.toLowerCase();
    }
    if (genres) {
        const genresLower = genres.map((genre) => genre.toLowerCase());
        updateExpressions.push("#genres = :genres");
        expressionAttributeNames["#genres"] = "Genres";
        expressionAttributeValues[":genres"] = genresLower;
    }
    if (actors) {
        const actorsLower = actors.map((actor) => actor.toLowerCase());
        updateExpressions.push("#actors = :actors");
        expressionAttributeNames["#actors"] = "Actors";
        expressionAttributeValues[":actors"] = actorsLower;
    }
    if (directors) {
        const directorsLower = directors.map((director) => director.toLowerCase());
        updateExpressions.push("#directors = :directors");
        expressionAttributeNames["#directors"] = "Directors";
        expressionAttributeValues[":directors"] = directorsLower;
    }

    let s3CoverSignedUrl, s3VideoSignedUrl;
    if (coverFileName && coverFileType) {
        const putCoverCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: `${movieId}/cover/${coverFileName}`,
            ContentType: coverFileType,
        });
        s3CoverSignedUrl = await getSignedUrl(s3Client, putCoverCommand, { expiresIn: 3600 });
        updateExpressions.push("#coverS3Url = :coverS3Url");
        expressionAttributeNames["#coverS3Url"] = "CoverS3Url";
        expressionAttributeValues[":coverS3Url"] = `https://${bucketName}.s3.amazonaws.com/${movieId}/cover/${coverFileName}`;
    }
    if (videoFileName && videoFileType) {
        const putVideoCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: `${movieId}/video/${videoFileName}`,
            ContentType: videoFileType,
        });
        s3VideoSignedUrl = await getSignedUrl(s3Client, putVideoCommand, { expiresIn: 3600 });
        updateExpressions.push("#videoS3Url = :videoS3Url");
        expressionAttributeNames["#videoS3Url"] = "VideoS3Url";
        expressionAttributeValues[":videoS3Url"] = `https://${bucketName}.s3.amazonaws.com/${movieId}/video/${videoFileName}`;
    }

    const updateExpression = "SET " + updateExpressions.join(", ");

    const updateCommand = new UpdateCommand({
        TableName: tableName,
        Key: { MovieId: movieId },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "UPDATED_NEW",
    });

    const dynamoResponse = await dynamoDocClient.send(updateCommand);
    console.log(dynamoResponse);

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Headers": "Origin,Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
            "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
            coverUploadURL: s3CoverSignedUrl,
            videoUploadURL: s3VideoSignedUrl,
            movieId: movieId,
        }),
    };
};
