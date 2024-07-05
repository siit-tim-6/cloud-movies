const {
    SNSClient,
    ListTopicsCommand,
    CreateTopicCommand,
    PublishCommand,
    SubscribeCommand
} = require("@aws-sdk/client-sns");

const snsClient = new SNSClient({});

exports.handler = async (event) => {
    const message = JSON.parse(event.body);
    const {topicName, email} = message;
    const filteredTopicName = topicName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase()

    // Check if SNS topic exists
    let topicArn;
    const listTopicsCommand = new ListTopicsCommand({});
    const listTopicsResponse = await snsClient.send(listTopicsCommand);
    const existingTopic = listTopicsResponse.Topics.find((t) => t.TopicArn.includes(filteredTopicName));

    if (existingTopic) {
        topicArn = existingTopic.TopicArn;
    } else {
        const createTopicCommand = new CreateTopicCommand({Name: topicName});
        const createTopicResponse = await snsClient.send(createTopicCommand);
        topicArn = createTopicResponse.TopicArn;
    }

    if (!email) {
        const publishCommand = new PublishCommand({
            TopicArn: topicArn,
            Message: JSON.stringify(`A new ${topicName} movie has been released.`),
            Subject: "New Movie Release",
        });

        await snsClient.send(publishCommand);
    } else {
        const subscribeCommand = new SubscribeCommand({
            Protocol: "email",
            TopicArn: topicArn,
            Endpoint: email,
        });

        await snsClient.send(subscribeCommand);
    }
}
