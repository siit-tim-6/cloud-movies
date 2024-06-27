const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
    const bucketName = process.env.S3_BUCKET;
    const tableName = process.env.DYNAMODB_TABLE;

    console.log(bucketName);
    console.log(tableName);
    const { title, description, genre, actors, directors, coverFileName, coverFileType, videoFileName, videoFileType } = JSON.parse(event.body);
    const movieId = uuidv4();

    const coverS3Params = {
        Bucket: bucketName,
        Key: `${movieId}/cover/${coverFileName}`,
        Expires: 60,
        ContentType: coverFileType,
    };

    const videoS3Params = {
        Bucket: bucketName,
        Key: `${movieId}/video/${videoFileName}`,
        Expires: 60,
        ContentType: videoFileType,
    };

    const coverUploadURL = s3.getSignedUrl('putObject', coverS3Params);
    const videoUploadURL = s3.getSignedUrl('putObject', videoS3Params);

    const dynamoParams = {
        TableName: tableName,
        Item: {
            movieId: movieId,
            title: title,
            description: description,
            genre: genre,
            actors: actors,
            directors: directors,
            coverS3Url: `https://${bucketName}.s3.amazonaws.com/${movieId}/cover/${coverFileName}`,
            videoS3Url: `https://${bucketName}.s3.amazonaws.com/${movieId}/video/${videoFileName}`,
            createdAt: new Date().toISOString(),
        },
    };

    await dynamoDb.put(dynamoParams).promise();

    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
            coverUploadURL: coverUploadURL,
            videoUploadURL: videoUploadURL,
            movieId: movieId,
        }),
    };
};
