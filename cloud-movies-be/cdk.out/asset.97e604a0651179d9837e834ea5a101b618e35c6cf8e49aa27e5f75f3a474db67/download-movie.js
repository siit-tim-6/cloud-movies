const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { DynamoDBClient, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client();
const dynamoDb = new DynamoDBClient();

exports.handler = async (event) => {
    const bucketName = process.env.S3_BUCKET;
    const tableName = process.env.DYNAMODB_TABLE;
    const movieId = event.pathParameters.movieId;

    if (!movieId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Movie ID is required" }),
        };
    }

    try {
        const params = {
            TableName: tableName,
            Key: { movieId: movieId },
        };

        const data = await dynamoDb.send(new GetCommand(params));
        if (!data.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: "Movie not found" }),
            };
        }

        const videoS3Url = data.Item.videoS3Url;
        const videoS3Key = videoS3Url.split(`https://${bucketName}.s3.amazonaws.com/`)[1];

        const videoS3Params = {
            Bucket: bucketName,
            Key: videoS3Key,
        };

        const videoDownloadURL = await getSignedUrl(s3, new GetObjectCommand(videoS3Params), { expiresIn: 3600 });
        return {
            statusCode: 200,
            body: JSON.stringify({ videoDownloadURL }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Could not generate signed URL' }),
        };
    }
};