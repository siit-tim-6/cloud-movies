"use strict";

const { SFNClient, StartExecutionCommand } = require("@aws-sdk/client-sfn");

const stepFunctionsClient = new SFNClient();

exports.handler = async (event) => {
  const stateMachineArn = process.env.STATE_MACHINE_ARN;

  for (const record of event.Records) {
    const messageBody = JSON.parse(record.body);

    const { userId } = messageBody;
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
};
