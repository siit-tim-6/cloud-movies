const { SNSClient, ListTopicsCommand, CreateTopicCommand, PublishCommand } = require("@aws-sdk/client-sns");

const snsClient = new SNSClient({});
exports.handler = async (event) => {
  for (const record of event.Records) {
    const message = JSON.parse(record.body);
    const { topicName, movieId, movieTitle } = message;
    const filteredTopicName = topicName
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase()
      .trim();
    let topicArn = await getTopicArn(filteredTopicName);

    await publish(topicArn, topicName, movieId, movieTitle);
  }
};

async function getTopicArn(filteredTopicName) {
  // Check if SNS topic exists
  const listTopicsCommand = new ListTopicsCommand({});
  const listTopicsResponse = await snsClient.send(listTopicsCommand);
  const existingTopic = listTopicsResponse.Topics.find((t) => t.TopicArn.includes(filteredTopicName));

  if (existingTopic) {
    return existingTopic.TopicArn;
  }

  const createTopicCommand = new CreateTopicCommand({ Name: filteredTopicName });
  const createTopicResponse = await snsClient.send(createTopicCommand);
  return createTopicResponse.TopicArn;
}

async function publish(topicArn, topicName, movieId, movieTitle) {
  const publishCommand = new PublishCommand({
    TopicArn: topicArn,
    Message: `A new ${topicName} movie has been released.
      
      Title: ${movieTitle}
      
      Check it out: https://d1l5yd6wj9eafn.cloudfront.net/movies/${movieId}`,
    Subject: "New Movie Release",
  });

  await snsClient.send(publishCommand);
}
