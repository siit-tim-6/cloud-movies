"use strict";

const { SFNClient, StartExecutionCommand } = require("@aws-sdk/client-sfn");
const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const stepFunctionsClient = new SFNClient();
const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
    const stateMachineArn = process.env.STATE_MACHINE_ARN;
    const feedsTable = process.env.FEEDS_TABLE;

    for (const record of event.Records) {
        const messageBody = JSON.parse(record.body);

        const { userId, eventType } = messageBody;

        console.log("Event: " + eventType);

        if (eventType === "delete" || eventType === "add") {
            try {
                const scanParams = {
                    TableName: feedsTable,
                    ProjectionExpression: "UserId"
                };

                const scanCommand = new ScanCommand(scanParams);
                const scanResponse = await dynamoDocClient.send(scanCommand);

                const usersToUpdate = scanResponse.Items.map(item => item.UserId.S);

                for (const userId of usersToUpdate) {
                    const stepFunctionInput = { userId };
                    const params = {
                        stateMachineArn: stateMachineArn,
                        input: JSON.stringify(stepFunctionInput),
                    };

                    const command = new StartExecutionCommand(params);
                    try {
                        const data = await stepFunctionsClient.send(command);
                        console.log(`Step Function started with execution ARN: ${data.executionArn}`);
                    } catch (err) {
                        console.error(`Failed to start Step Function: ${err}`);
                    }
                }
            } catch (err) {
                console.error(`Failed to update feedsTable for ${eventType} event: ${err}`);
            }
        } else {
            const stepFunctionInput = { userId };
            const params = {
                stateMachineArn: stateMachineArn,
                input: JSON.stringify(stepFunctionInput),
            };

            const command = new StartExecutionCommand(params);
            try {
                const data = await stepFunctionsClient.send(command);
                console.log(`Step Function started with execution ARN: ${data.executionArn}`);
            } catch (err) {
                console.error(`Failed to start Step Function: ${err}`);
            }
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify('Step Function executions started'),
    };
};
