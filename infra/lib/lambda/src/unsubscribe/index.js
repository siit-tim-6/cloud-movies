"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DeleteCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { CognitoIdentityProviderClient, AdminGetUserCommand } = require("@aws-sdk/client-cognito-identity-provider");
const { SNSClient, UnsubscribeCommand, ListTopicsCommand, CreateTopicCommand, ListSubscriptionsByTopicCommand, DeleteSubscriptionCommand } = require("@aws-sdk/client-sns");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({});
const snsClient = new SNSClient({});
const sqsClient = new SQSClient({});

exports.handler = async (event) => {
  const tableName = process.env.DYNAMODB_TABLE;
  const userPoolId = process.env.COGNITO_USER_POOL_ID.split("/").pop();
  const { subscribedTo } = event.queryStringParameters;
  const { Authorization } = event.headers;
  const queueUrl = process.env.FEED_UPDATE_QUEUE_URL;

  const userId = JSON.parse(Buffer.from(Authorization.split(".")[1], "base64").toString()).sub;
  const username = JSON.parse(Buffer.from(Authorization.split(".")[1], "base64").toString()).username;

  const userCommand = new AdminGetUserCommand({
    UserPoolId: userPoolId,
    Username: username,
  });

  const userResponse = await cognitoClient.send(userCommand);
  const userEmail = userResponse.UserAttributes.find(attr => attr.Name === "email").Value;

  try {
    await snsUnsubscribe(subscribedTo, userEmail);
  } catch (error) {
    if (error.message.toLowerCase().includes('pending confirmation')) {
      console.log("Error in unsubscribing: ", error.message);
      return {
        statusCode: 412,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Headers": "Origin,Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
          "Access-Control-Allow-Methods": "POST,OPTIONS",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: error.message }),
      };
    }
  }

  const dynamoDeleteCommand = new DeleteCommand({
    TableName: tableName,
    Key: {
      UserId: userId,
      SubscribedTo: subscribedTo,
    },
  });
  await dynamoDocClient.send(dynamoDeleteCommand);

  const sqsMessage = {
    userId: userId,
    eventType: "unsubscribe",
  };

  const sqsParams = {
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(sqsMessage),
  };

  await sqsClient.send(new SendMessageCommand(sqsParams));

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Headers": "Origin,Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Origin": "*",
    },
  };
};


async function snsUnsubscribe(subscribedTo, userEmail) {
  const filteredTopicName = subscribedTo.replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase().trim();
  // Check if SNS topic exists
  let topicArn;
  const listTopicsCommand = new ListTopicsCommand({});
  const listTopicsResponse = await snsClient.send(listTopicsCommand);
  const existingTopic = listTopicsResponse.Topics.find((t) => t.TopicArn.includes(filteredTopicName));

  if (!existingTopic) {
    // Create the SNS topic
    const createTopicCommand = new CreateTopicCommand({
      Name: filteredTopicName,
    });

    console.log("Creating topic...");
    const createTopicResponse = await snsClient.send(createTopicCommand);
    topicArn = createTopicResponse.TopicArn;
  } else {
    topicArn = existingTopic.TopicArn;
  }

  await unsubscribeFromTopic(topicArn, userEmail);
}

async function unsubscribeFromTopic(topicArn, userEmail) {
  console.log("Listing subscriptions for topic...");
  const listSubscriptionsCommand = new ListSubscriptionsByTopicCommand({
    TopicArn: topicArn
  });
  const listSubscriptionsResponse = await snsClient.send(listSubscriptionsCommand);

  // Find the subscription ARN for the userEmail
  let subscriptionArn;
  for (const subscription of listSubscriptionsResponse.Subscriptions) {
    if (subscription.Endpoint === userEmail) {
      subscriptionArn = subscription.SubscriptionArn;
      break;
    }
  }

  console.log("Subscription ARN: ", subscriptionArn);

  if (!subscriptionArn) {
    throw new Error(`Subscription not found for email: ${userEmail}`);
  }

  if (subscriptionArn.includes("PendingConfirmation")) {
    throw new Error("Subscription is pending confirmation");
  }

    // Subscription is confirmed, proceed with unsubscribe
  console.log("Unsubscribing user from topic...");
  const unsubscribeCommand = new UnsubscribeCommand({
    SubscriptionArn: subscriptionArn
  });
  await snsClient.send(unsubscribeCommand);
}
