"use strict";

const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
const sqsClient = new SQSClient({});

exports.handler = async (event) => {
  const sqsQueueUrl = process.env.SQS_URL;
  const feedsTable = process.env.FEEDS_TABLE;

  for (const record of event.Records) {
    const messageBody = JSON.parse(record.body);

    const { userId, eventType } = messageBody;

    console.log("Event: " + eventType);

    if (eventType === "delete" || eventType === "add") {
      try {
        const scanParams = {
          TableName: feedsTable,
          ProjectionExpression: "UserId",
        };

        const scanCommand = new ScanCommand(scanParams);
        const scanResponse = await dynamoDocClient.send(scanCommand);

        const usersToUpdate = scanResponse.Items.map((item) => item.UserId.S);

        let delay = 0;

        for (const userId of usersToUpdate) {
          const sqsMessage = {
            userId,
          };
          const sqsParams = {
            DelaySeconds: delay,
            QueueUrl: sqsQueueUrl,
            MessageBody: JSON.stringify(sqsMessage),
          };

          await sqsClient.send(new SendMessageCommand(sqsParams));
          delay += 15;
        }
      } catch (err) {
        console.error(`Failed to update feedsTable for ${eventType} event: ${err}`);
      }
    } else {
      const sqsMessage = {
        userId,
      };
      const sqsParams = {
        QueueUrl: sqsQueueUrl,
        MessageBody: JSON.stringify(sqsMessage),
      };

      await sqsClient.send(new SendMessageCommand(sqsParams));
    }
  }
};
