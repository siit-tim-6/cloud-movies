"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { UpdateCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { CloudFrontClient, CreateInvalidationCommand } = require("@aws-sdk/client-cloudfront");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
const cloudFrontClient = new CloudFrontClient({});

exports.handler = async (event) => {
  const statusTable = process.env.STATUS_TABLE;
  const distributionId = process.env.DISTRIBUTION_ID;
  const id = event[4].Payload.id;
  console.log(id);

  const dynamoUpdateCommand = new UpdateCommand({
    TableName: statusTable,
    Key: {
      MovieId: id,
    },
    UpdateExpression: "set #videoStatus = :x",
    ExpressionAttributeNames: { "#videoStatus": "Status" },
    ExpressionAttributeValues: { ":x": "FINISHED" },
  });

  await dynamoDocClient.send(dynamoUpdateCommand);

  console.log("Successfully updated video status");

  const invalidationParams = {
    DistributionId: distributionId,
    InvalidationBatch: {
      Paths: {
        Quantity: 1,
        Items: [`/${id}/*`],
      },
      CallerReference: Date.now().toString(), // required
    },
  };

  console.log(invalidationParams);

  await cloudFrontClient.send(new CreateInvalidationCommand(invalidationParams));

  console.log("cloudfront invalidated");
};
