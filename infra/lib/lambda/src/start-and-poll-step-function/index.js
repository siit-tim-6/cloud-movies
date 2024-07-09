const { SFNClient, StartExecutionCommand, DescribeExecutionCommand } = require("@aws-sdk/client-sfn");

const sfnClient = new SFNClient({});

exports.handler = async (event) => {
    const input = JSON.stringify({
        headers: {
            Authorization: event.headers.Authorization
        }
    });

    const stateMachineArn = process.env.GET_FEED_STATE_MACHINE_ARN;
    const startExecutionCommand = new StartExecutionCommand({
        stateMachineArn,
        input: input,
    });

    let startExecutionResponse;
    try {
        startExecutionResponse = await sfnClient.send(startExecutionCommand);
    } catch (error) {
        console.error("Failed to start Step Function execution:", error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "GET,OPTIONS"
            },
            body: JSON.stringify({ error: "Failed to start Step Function execution" }),
        };
    }

    const executionArn = startExecutionResponse.executionArn;

    let executionStatus;
    while (true) {
        const describeExecutionCommand = new DescribeExecutionCommand({ executionArn });
        let describeExecutionResponse;
        try {
            describeExecutionResponse = await sfnClient.send(describeExecutionCommand);
        } catch (error) {
            console.error("Failed to describe Step Function execution:", error);
            return {
                statusCode: 500,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization",
                    "Access-Control-Allow-Methods": "GET,OPTIONS"
                },
                body: JSON.stringify({ error: "Failed to describe Step Function execution" }),
            };
        }
        executionStatus = describeExecutionResponse.status;

        if (executionStatus === "SUCCEEDED") {
            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization",
                    "Access-Control-Allow-Methods": "GET,OPTIONS"
                },
                body: describeExecutionResponse.output,
            };
        } else if (executionStatus === "FAILED" || executionStatus === "TIMED_OUT" || executionStatus === "ABORTED") {
            return {
                statusCode: 500,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization",
                    "Access-Control-Allow-Methods": "GET,OPTIONS"
                },
                body: `Step Function execution failed with status: ${executionStatus}. Details: ${JSON.stringify(describeExecutionResponse, null, 2)}`,
            };
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
    }
};
