const {
  SNSClient,
  ListTopicsCommand,
  CreateTopicCommand,
  PublishCommand,
  SubscribeCommand,
  UnsubscribeCommand,
  ListSubscriptionsByTopicCommand,
} = require("@aws-sdk/client-sns");

const snsClient = new SNSClient({});
exports.handler = async (event) => {

  for (const record of event.Records) {
    const message = JSON.parse(record.body);
    const {topicName, email, unsubscribe} = message;
    const filteredTopicName = topicName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase().trim()
    let topicArn = await getTopicArn(filteredTopicName);

    if (!email) {
      await publish(topicArn, topicName);
    } else {
      if (unsubscribe) {
        await unsubscribeFromTopic(topicArn, email);
      }
      else
      {
        await subscribe(topicArn, email);
      }
    }
  }
}

async function subscribe(topicArn, email) {
  const subscribeCommand = new SubscribeCommand({
    Protocol: "email",
    TopicArn: topicArn,
    Endpoint: email,
  });

  await snsClient.send(subscribeCommand);
}

async function getTopicArn(filteredTopicName) {
  // Check if SNS topic exists
  const listTopicsCommand = new ListTopicsCommand({});
  const listTopicsResponse = await snsClient.send(listTopicsCommand);
  const existingTopic = listTopicsResponse.Topics.find((t) => t.TopicArn.includes(filteredTopicName));

  if (existingTopic) {
    return existingTopic.TopicArn;
  }
  const createTopicCommand = new CreateTopicCommand({Name: filteredTopicName});
  const createTopicResponse = await snsClient.send(createTopicCommand);
  return createTopicResponse.TopicArn;
}

async function publish(topicArn, topicName) {
  const publishCommand = new PublishCommand({
    TopicArn: topicArn,
    Message: JSON.stringify(`A new ${topicName} movie has been released.`),
    Subject: "New Movie Release",
  });

  await snsClient.send(publishCommand);
}

async function unsubscribeFromTopic(topicArn, userEmail) {
    // List subscriptions for the topic
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

    if (!subscriptionArn) {
      throw new Error(`Subscription not found for email: ${userEmail}`);
    }

    // Unsubscribe the user
    const unsubscribeCommand = new UnsubscribeCommand({
      SubscriptionArn: subscriptionArn
    });
    await snsClient.send(unsubscribeCommand);
}