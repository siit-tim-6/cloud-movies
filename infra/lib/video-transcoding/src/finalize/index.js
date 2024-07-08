"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { UpdateCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  const statusTable = process.env.STATUS_TABLE;
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
};
