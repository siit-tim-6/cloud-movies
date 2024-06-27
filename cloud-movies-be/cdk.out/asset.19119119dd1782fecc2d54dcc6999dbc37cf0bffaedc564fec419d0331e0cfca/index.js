"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { GetCommand, UpdateCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { PutObjectCommand, DeleteObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

exports.handler = async (event) => {
    const bucketName = process.env.S3_BUCKET;
    const tableName = process.env.DYNAMODB_TABLE;
    const { id } = event.pathParameters;
    const { title, description, genre, actors, directors, coverFileName, coverFileType, videoFileName, videoFileType } = JSON.parse(event.body);

    // Fetch current movie details
    const getCommand = new GetCommand({
        TableName: tableName,
        Key: { MovieId: id },
    });

    const movie = await dynamoDocClient.send(getCommand);

    if (!movie.Item) {
        return {
            statusCode: 404,
            body: JSON.stringify({ message: "Movie not found" }),
        };
    }

    const { CoverS3Url, VideoS3Url } = movie.Item;

    let coverUploadURL;
    let videoUploadURL;

    // Update cover if provided
    if (coverFileName && coverFileType) {
        // Delete old cover from S3
        if (CoverS3Url) {
            const deleteOldCoverCommand = new DeleteObjectCommand({
                Bucket: bucketName,
                Key: CoverS3Url.split('.com/')[1],
            });
            await s3Client.send(deleteOldCoverCommand);
        }

        // Generate new signed URL for the new cover
        const putCoverCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: `${id}/cover/${coverFileName}`,
            ContentType: coverFileType,
        });
        coverUploadURL = await getSignedUrl(s3Client, putCoverCommand, { expiresIn: 3600 });
    }

    // Update video if provided
    if (videoFileName && videoFileType) {
        // Delete old video from S3
        if (VideoS3Url) {
            const deleteOldVideoCommand = new DeleteObjectCommand({
                Bucket: bucketName,
                Key: VideoS3Url.split('.com/')[1],
            });
            await s3Client.send(deleteOldVideoCommand);
        }

        // Generate new signed URL for the new video
        const putVideoCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: `${id}/video/${videoFileName}`,
            ContentType: videoFileType,
        });
        videoUploadURL = await getSignedUrl(s3Client, putVideoCommand, { expiresIn: 3600 });
    }

    // Update item in DynamoDB
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    if (title) {
        updateExpression.push("#title = :title, #lowerTitle = :lowerTitle");
        expressionAttributeNames["#title"] = "Title";
        expressionAttributeNames["#lowerTitle"] = "LowerTitle";
        expressionAttributeValues[":title"] = title;
        expressionAttributeValues[":lowerTitle"] = title.toLowerCase();
    }
    if (description) {
        updateExpression.push("#description = :description, #lowerDescription = :lowerDescription");
        expressionAttributeNames["#description"] = "Description";
        expressionAttributeNames["#lowerDescription"] = "LowerDescription";
        expressionAttributeValues[":description"] = description;
        expressionAttributeValues[":lowerDescription"] = description.toLowerCase();
    }
    if (genre) {
        updateExpression.push("#genre = :genre, #lowerGenre = :lowerGenre");
        expressionAttributeNames["#genre"] = "Genre";
        expressionAttributeNames["#lowerGenre"] = "LowerGenre";
        expressionAttributeValues[":genre"] = genre;
        expressionAttributeValues[":lowerGenre"] = genre.toLowerCase();
    }
    if (actors) {
        updateExpression.push("#actors = :actors, #lowerActors = :lowerActors");
        expressionAttributeNames["#actors"] = "Actors";
        expressionAttributeNames["#lowerActors"] = "LowerActors";
        expressionAttributeValues[":actors"] = actors;
        expressionAttributeValues[":lowerActors"] = actors.toLowerCase();
    }
    if (directors) {
        updateExpression.push("#directors = :directors, #lowerDirectors = :lowerDirectors");
        expressionAttributeNames["#directors"] = "Directors";
        expressionAttributeNames["#lowerDirectors"] = "LowerDirectors";
        expressionAttributeValues[":directors"] = directors;
        expressionAttributeValues[":lowerDirectors"] = directors.toLowerCase();
    }
    if (coverFileName) {
        updateExpression.push("#coverS3Url = :coverS3Url");
        expressionAttributeNames["#coverS3Url"] = "CoverS3Url";
        expressionAttributeValues[":coverS3Url"] = `https://${bucketName}.s3.amazonaws.com/${id}/cover/${coverFileName}`;
    } else {
        expressionAttributeNames["#coverS3Url"] = "CoverS3Url";
        expressionAttributeValues[":coverS3Url"] = CoverS3Url;
    }
    if (videoFileName) {
        updateExpression.push("#videoS3Url = :videoS3Url");
        expressionAttributeNames["#videoS3Url"] = "VideoS3Url";
        expressionAttributeValues[":videoS3Url"] = `https://${bucketName}.s3.amazonaws.com/${id}/video/${videoFileName}`;
    } else {
        expressionAttributeNames["#videoS3Url"] = "VideoS3Url";
        expressionAttributeValues[":videoS3Url"] = VideoS3Url;
    }

    const updateCommand = new UpdateCommand({
        TableName: tableName,
        Key: { MovieId: id },
        UpdateExpression: `SET ${updateExpression.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "UPDATED_NEW"
    });

    const updateResponse = await dynamoDocClient.send(updateCommand);
    console.log(updateResponse);

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Headers": "Origin,Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "PUT,OPTIONS",
            "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
            coverUploadURL,
            videoUploadURL,
        }),
    };
};
