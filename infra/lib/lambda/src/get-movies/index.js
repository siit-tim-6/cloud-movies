"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { QueryCommand, ScanCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { GetObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

exports.handler = async (event) => {
  const tableName = process.env.DYNAMODB_TABLE;
  const bucketName = process.env.S3_BUCKET;

  if (event.queryStringParameters === null) {
    event.queryStringParameters = {};
  }
  const { title, description, actor, director, genre } = event?.queryStringParameters;

  const filterExpressions = [];
  const expressionAttributeValues = {};

  if (title && description && actor && director && genre) {
    console.log("Everything search activated");
    const everythingSearch = [title, description, actor, director, genre].join("#");
    console.log(everythingSearch);

    const movieSingleSearchResponse = await dynamoDocClient.send(
      new QueryCommand({
        TableName: tableName,
        ProjectionExpression: "MovieId, Title, Genres, CoverS3Url",
        IndexName: "everythingSearch",
        KeyConditionExpression: "EverythingSearch = :everythingSearch",
        ExpressionAttributeValues: {
          ":everythingSearch": everythingSearch.toLowerCase(),
        },
      })
    );

    console.log(movieSingleSearchResponse);

    if (movieSingleSearchResponse.Items.length > 0) {
      console.log("Everything search found!!!");

      const populateCoverPromises = movieSingleSearchResponse.Items.map(async (item) => {
        const s3CoverUrlKey = item.CoverS3Url.split(`https://${bucketName}.s3.amazonaws.com/`)[1];
        const getCoverCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: s3CoverUrlKey,
        });
        const s3CoverSignedUrl = await getSignedUrl(s3Client, getCoverCommand, { expiresIn: 3600 });

        return {
          MovieId: item.MovieId,
          Title: item.Title,
          Genres: item.Genres,
          CoverS3Url: s3CoverSignedUrl,
        };
      });

      const body = await Promise.all(populateCoverPromises);
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Headers": "Origin,Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
          "Access-Control-Allow-Methods": "GET,OPTIONS",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(body),
      };
    }
  }

  if (actor) {
    filterExpressions.push("contains(Actors, :actor)");
    expressionAttributeValues[":actor"] = actor.toLowerCase();
  }

  if (director) {
    filterExpressions.push("contains(Directors, :director)");
    expressionAttributeValues[":director"] = director.toLowerCase();
  }

  if (genre) {
    filterExpressions.push("contains(Genres, :genre)");
    expressionAttributeValues[":genre"] = genre.toLowerCase();
  }

  let dynamoCommandProps = {
    TableName: tableName,
    ProjectionExpression: "MovieId, Title, Genres, CoverS3Url",
  };

  if (title && description) {
    dynamoCommandProps["IndexName"] = "titleSearch";
    dynamoCommandProps["KeyConditionExpression"] = "LowerTitle = :title AND begins_with(LowerDescription, :description)";
    expressionAttributeValues[":title"] = title.toLowerCase();
    expressionAttributeValues[":description"] = description.toLowerCase();
  } else if (title) {
    dynamoCommandProps["IndexName"] = "titleSearch";
    dynamoCommandProps["KeyConditionExpression"] = "LowerTitle = :title";
    expressionAttributeValues[":title"] = title.toLowerCase();
  } else if (description) {
    dynamoCommandProps["IndexName"] = "descriptionSearch";
    dynamoCommandProps["KeyConditionExpression"] = "LowerDescription = :description";
    expressionAttributeValues[":description"] = description.toLowerCase();
  }

  if (Object.keys(expressionAttributeValues).length) {
    dynamoCommandProps["ExpressionAttributeValues"] = expressionAttributeValues;
  }
  if (filterExpressions.length > 0) {
    dynamoCommandProps["FilterExpression"] = filterExpressions.join(" AND ");
  }

  console.log(dynamoCommandProps);

  const dynamoCommand = title || description ? new QueryCommand(dynamoCommandProps) : new ScanCommand(dynamoCommandProps);
  const moviesResponse = await dynamoDocClient.send(dynamoCommand);

  const moviesWithCoverPromises = moviesResponse.Items.map(async (item) => {
    const s3CoverUrlKey = item.CoverS3Url.split(`https://${bucketName}.s3.amazonaws.com/`)[1];
    const getCoverCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3CoverUrlKey,
    });
    const s3CoverSignedUrl = await getSignedUrl(s3Client, getCoverCommand, { expiresIn: 3600 });

    return {
      MovieId: item.MovieId,
      Title: item.Title,
      Genres: item.Genres,
      CoverS3Url: s3CoverSignedUrl,
    };
  });

  const responseBody = await Promise.all(moviesWithCoverPromises);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Headers": "Origin,Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(responseBody),
  };
};
