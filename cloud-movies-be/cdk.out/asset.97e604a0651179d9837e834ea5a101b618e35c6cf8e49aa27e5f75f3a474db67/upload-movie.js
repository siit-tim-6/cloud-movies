const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { DynamoDBClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
//const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");

const s3 = new S3Client();
const dynamoDb = new DynamoDBClient();

exports.handler = async (event) => {
    const bucketName = process.env.S3_BUCKET;
    const tableName = process.env.DYNAMODB_TABLE;

    const { title, description, genre, actors, directors, coverFileName, coverFileType, videoFileName, videoFileType } = JSON.parse(event.body);
    const movieId = uuidv4();

    const coverS3Params = {
        Bucket: bucketName,
        Key: `${movieId}/cover/${coverFileName}`,
        ContentType: coverFileType,
    };

    const videoS3Params = {
        Bucket: bucketName,
        Key: `${movieId}/video/${videoFileName}`,
        ContentType: videoFileType,
    };

    const coverUploadURL = await s3.getSignedUrl(new PutObjectCommand(coverS3Params));
    const videoUploadURL = await s3.getSignedUrl(new PutObjectCommand(videoS3Params));

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

    await dynamoDb.send(new PutCommand(dynamoParams));

    return {
        statusCode: 200,
        body: JSON.stringify({
            coverUploadURL: coverUploadURL,
            videoUploadURL: videoUploadURL,
            movieId: movieId,
        }),
    };
};
