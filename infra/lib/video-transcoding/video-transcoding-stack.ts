import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import path = require("path");
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

export interface VideoTranscodingProps extends cdk.StackProps {
  moviesBucket: s3.Bucket;
  transcodedVideosBucket: s3.Bucket;
  transcodingStatusTable: dynamodb.Table;
  transcodingQueue: sqs.Queue;
}

export class VideoTranscodingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: VideoTranscodingProps) {
    super(scope, id, props);

    const { moviesBucket, transcodedVideosBucket, transcodingStatusTable, transcodingQueue } = props!;

    const ffmpegLayer = new lambda.LayerVersion(this, "ffmpegLayer", {
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/layers")),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
    });

    const convertTo360pFn = new lambda.Function(this, "convertTo360pFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/convert-to-360p")),
      environment: {
        S3_INPUT_BUCKET: moviesBucket.bucketName,
        S3_OUTPUT_BUCKET: transcodedVideosBucket.bucketName,
      },
      memorySize: 1024,
      timeout: cdk.Duration.seconds(900),
      layers: [ffmpegLayer],
    });

    const convertTo480pFn = new lambda.Function(this, "convertTo480pFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/convert-to-480p")),
      environment: {
        S3_INPUT_BUCKET: moviesBucket.bucketName,
        S3_OUTPUT_BUCKET: transcodedVideosBucket.bucketName,
      },
      memorySize: 1024,
      timeout: cdk.Duration.seconds(900),
      layers: [ffmpegLayer],
    });

    const convertTo720pFn = new lambda.Function(this, "convertTo720pFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/convert-to-720p")),
      environment: {
        S3_INPUT_BUCKET: moviesBucket.bucketName,
        S3_OUTPUT_BUCKET: transcodedVideosBucket.bucketName,
      },
      memorySize: 1024,
      timeout: cdk.Duration.seconds(900),
      layers: [ffmpegLayer],
    });

    const convertTo1080pFn = new lambda.Function(this, "convertTo1080pFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/convert-to-1080p")),
      environment: {
        S3_INPUT_BUCKET: moviesBucket.bucketName,
        S3_OUTPUT_BUCKET: transcodedVideosBucket.bucketName,
      },
      memorySize: 1024,
      timeout: cdk.Duration.seconds(900),
      layers: [ffmpegLayer],
    });

    const createMetadataAndPlaylistFn = new lambda.Function(this, "createMetadataAndPlaylistFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/create-metadata-and-playlist")),
      environment: {
        S3_OUTPUT_BUCKET: transcodedVideosBucket.bucketName,
        STATUS_TABLE: transcodingStatusTable.tableName,
      },
    });

    const finalizeFn = new lambda.Function(this, "finalizeFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/finalize")),
      environment: {
        STATUS_TABLE: transcodingStatusTable.tableName,
      },
    });

    moviesBucket.grantRead(convertTo360pFn);
    moviesBucket.grantRead(convertTo480pFn);
    moviesBucket.grantRead(convertTo720pFn);
    moviesBucket.grantRead(convertTo1080pFn);
    transcodedVideosBucket.grantWrite(convertTo360pFn);
    transcodedVideosBucket.grantWrite(convertTo480pFn);
    transcodedVideosBucket.grantWrite(convertTo720pFn);
    transcodedVideosBucket.grantWrite(convertTo1080pFn);
    transcodedVideosBucket.grantWrite(createMetadataAndPlaylistFn);

    const convertTo360p = new tasks.LambdaInvoke(this, "convertTo360p", {
      lambdaFunction: convertTo360pFn,
    });
    const convertTo480p = new tasks.LambdaInvoke(this, "convertTo480p", {
      lambdaFunction: convertTo480pFn,
    });
    const convertTo720p = new tasks.LambdaInvoke(this, "convertTo720p", {
      lambdaFunction: convertTo720pFn,
    });
    const convertTo1080p = new tasks.LambdaInvoke(this, "convertTo1080p", {
      lambdaFunction: convertTo1080pFn,
    });
    const createMetadataAndPlaylist = new tasks.LambdaInvoke(this, "createMetadataAndPlaylist", {
      lambdaFunction: createMetadataAndPlaylistFn,
    });
    const finalize = new tasks.LambdaInvoke(this, "finalize", {
      lambdaFunction: finalizeFn,
    });

    const convertVideoParallel = new sfn.Parallel(this, "convertVideoParallel");
    convertVideoParallel.branch(convertTo360p);
    convertVideoParallel.branch(convertTo480p);
    convertVideoParallel.branch(convertTo720p);
    convertVideoParallel.branch(convertTo1080p);
    convertVideoParallel.branch(createMetadataAndPlaylist);
    convertVideoParallel.addRetry();
    convertVideoParallel.next(finalize);

    const transcodingStateMachine = new sfn.StateMachine(this, "transcodingStateMachine", {
      definitionBody: sfn.DefinitionBody.fromChainable(convertVideoParallel),
    });

    const invokePipelineFn = new lambda.Function(this, "invokePipelineFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/invoke-pipeline")),
      environment: {
        SFN_ARN: transcodingStateMachine.stateMachineArn,
      },
    });

    transcodingStateMachine.grantStartExecution(invokePipelineFn);
    moviesBucket.grantRead(invokePipelineFn);
    transcodingQueue.grantConsumeMessages(invokePipelineFn);
    invokePipelineFn.addEventSource(new SqsEventSource(transcodingQueue));
    transcodingStatusTable.grantWriteData(createMetadataAndPlaylistFn);
    transcodingStatusTable.grantWriteData(finalizeFn);

    const videoDistribution = new cloudfront.Distribution(this, "videoDistribution", {
      defaultBehavior: {
        origin: new origins.S3Origin(transcodedVideosBucket),
      },
    });
  }
}
