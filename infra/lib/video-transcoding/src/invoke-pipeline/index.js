"use strict";

const { S3Client, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { SFNClient, StartExecutionCommand } = require("@aws-sdk/client-sfn");

const s3Client = new S3Client();
const sfnClient = new SFNClient();

exports.handler = async (event, context) => {
  const sfnArn = process.env.SFN_ARN;

  for (const record of event.Records) {
    const body = JSON.parse(record.body);
    console.log(body);
    const bucket = body.Records[0].s3.bucket.name;
    const key = decodeURIComponent(body.Records[0].s3.object.key.replace(/\+/g, " "));

    try {
      const { ContentType } = await s3Client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );

      console.log("Content Type: ", ContentType);
      if (ContentType.includes("video")) {
        const startCommand = new StartExecutionCommand({
          stateMachineArn: sfnArn,
          input: JSON.stringify({
            key,
          }),
        });

        await sfnClient.send(startCommand);
      }

      return ContentType;
    } catch (err) {
      console.log(err);
      const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
      console.log(message);
      throw new Error(message);
    }
  }
};
