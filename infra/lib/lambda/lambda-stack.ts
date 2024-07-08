import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as stepfunctions from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Effect } from "aws-cdk-lib/aws-iam";
import path = require("path");
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

export interface LambdaStackProps extends cdk.StackProps {
  moviesDataTable: dynamodb.Table;
  subscriptionsDataTable: dynamodb.Table;
  moviesBucket: s3.Bucket;
  movieRatingsTable: dynamodb.Table;
  downloadsDataTable: dynamodb.Table;
  cognitoUserPool: cognito.UserPool;
  sqsQueue: sqs.Queue;
  transcodedVideosBucket: s3.Bucket;
  transcodingStatusTable: dynamodb.Table;
}

export class LambdaStack extends cdk.Stack {
  public readonly uploadMovieFn: lambda.Function;
  public readonly downloadMovieFn: lambda.Function;
  public readonly getSingleMovieFn: lambda.Function;
  public readonly getMoviesFn: lambda.Function;
  public readonly deleteMovieFn: lambda.Function;
  public readonly subscribeFn: lambda.Function;
  public readonly getSubscriptionsFn: lambda.Function;
  public readonly unsubscribeFn: lambda.Function;
  public readonly editMovieFn: lambda.Function;
  public readonly rateMovieFn: lambda.Function;
  public readonly getRatingsFn: lambda.Function;
  public readonly getDownloadsFn: lambda.Function;
  public readonly generateFeedFn: lambda.Function;
  public readonly startAndPollStepFunctionFn: lambda.Function;
  public readonly handleTopicMessageFn: lambda.Function;

  constructor(scope: Construct, id: string, props?: LambdaStackProps) {
    super(scope, id, props);

    const {
      moviesBucket,
      moviesDataTable,
      subscriptionsDataTable,
      movieRatingsTable,
      downloadsDataTable,
      cognitoUserPool,
      sqsQueue,
      transcodedVideosBucket,
      transcodingStatusTable,
    } = props!;

    this.uploadMovieFn = new lambda.Function(this, "uploadMovieFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/upload-movie")),
      environment: {
        S3_BUCKET: moviesBucket.bucketName,
        DYNAMODB_TABLE: moviesDataTable.tableName,
        SQS_QUEUE_URL: sqsQueue.queueUrl,
      },
    });

    this.downloadMovieFn = new lambda.Function(this, "downloadMovieFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/download-movie")),
      environment: {
        S3_BUCKET: moviesBucket.bucketName,
        DYNAMODB_TABLE: moviesDataTable.tableName,
        DOWNLOADS_TABLE: downloadsDataTable.tableName,
      },
    });

    this.getSingleMovieFn = new lambda.Function(this, "getSingleMovieFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/get-single-movie")),
      environment: {
        S3_BUCKET: moviesBucket.bucketName,
        DYNAMODB_TABLE: moviesDataTable.tableName,
        RATINGS_TABLE: movieRatingsTable.tableName,
      },
    });

    this.getMoviesFn = new lambda.Function(this, "getMoviesFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/get-movies")),
      environment: {
        S3_BUCKET: moviesBucket.bucketName,
        DYNAMODB_TABLE: moviesDataTable.tableName,
      },
    });

    this.deleteMovieFn = new lambda.Function(this, "deleteMovieFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/delete-movie")),
      environment: {
        S3_BUCKET: moviesBucket.bucketName,
        DYNAMODB_TABLE: moviesDataTable.tableName,
        MOVIE_RATINGS_TABLE: movieRatingsTable.tableName,
        DOWNLOADS_TABLE: downloadsDataTable.tableName,
        TRANSCODED_VIDEOS_BUCKET: transcodedVideosBucket.bucketName,
        TRANSCODING_STATUS_TABLE: transcodingStatusTable.tableName,
      },
      timeout: cdk.Duration.seconds(10),
    });

    this.subscribeFn = new lambda.Function(this, "subscribeFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/subscribe")),
      environment: {
        DYNAMODB_TABLE: subscriptionsDataTable.tableName,
        COGNITO_USER_POOL_ID: cognitoUserPool.userPoolId,
      },
    });

    this.getSubscriptionsFn = new lambda.Function(this, "getSubscriptionsFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/get-subscriptions")),
      environment: {
        DYNAMODB_TABLE: subscriptionsDataTable.tableName,
      },
    });

    this.unsubscribeFn = new lambda.Function(this, "unsubscribeFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/unsubscribe")),
      environment: {
        DYNAMODB_TABLE: subscriptionsDataTable.tableName,
        COGNITO_USER_POOL_ID: cognitoUserPool.userPoolId,
      },
    });

    this.editMovieFn = new lambda.Function(this, "editMovieFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/edit-movie")),
      environment: {
        S3_BUCKET: moviesBucket.bucketName,
        DYNAMODB_TABLE: moviesDataTable.tableName,
      },
    });

    this.rateMovieFn = new lambda.Function(this, "rateMovieFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/rate-movie")),
      environment: {
        MOVIE_RATINGS_TABLE: movieRatingsTable.tableName,
      },
    });

    this.getRatingsFn = new lambda.Function(this, "getRatingsFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/get-ratings")),
      environment: {
        RATINGS_TABLE: movieRatingsTable.tableName,
      },
    });

    this.getDownloadsFn = new lambda.Function(this, "getDownloadsFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/get-downloads")),
      environment: {
        DOWNLOADS_TABLE: downloadsDataTable.tableName,
      },
    });

    this.generateFeedFn = new lambda.Function(this, "generateFeedFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/get-feed")),
      environment: {
        MOVIES_TABLE: moviesDataTable.tableName,
        S3_BUCKET: moviesBucket.bucketName,
      },
    });

    const getSubscriptionsTask = new tasks.LambdaInvoke(this, "GetSubscriptions", {
      lambdaFunction: this.getSubscriptionsFn,
      payload: stepfunctions.TaskInput.fromObject({
        headers: {
          "Authorization.$": "$.headers.Authorization",
        },
      }),
      resultPath: "$.subscriptionsResult",
    });

    const getRatingsTask = new tasks.LambdaInvoke(this, "GetRatings", {
      lambdaFunction: this.getRatingsFn,
      payload: stepfunctions.TaskInput.fromObject({
        headers: {
          "Authorization.$": "$.headers.Authorization",
        },
      }),
      resultPath: "$.ratingsResult",
    });

    const getDownloadsTask = new tasks.LambdaInvoke(this, "GetDownloads", {
      lambdaFunction: this.getDownloadsFn,
      payload: stepfunctions.TaskInput.fromObject({
        headers: {
          "Authorization.$": "$.headers.Authorization",
        },
      }),
      resultPath: "$.downloadsResult",
    });

    const parallelState = new stepfunctions.Parallel(this, "ParallelTasks", {
      resultPath: "$.parallelResults",
    });

    parallelState.branch(getSubscriptionsTask);
    parallelState.branch(getRatingsTask);
    parallelState.branch(getDownloadsTask);

    const generateFeedTask = new tasks.LambdaInvoke(this, "GenerateFeed", {
      lambdaFunction: this.generateFeedFn,
      payload: stepfunctions.TaskInput.fromObject({
        subscriptions: stepfunctions.JsonPath.stringAt("$.parallelResults[0].subscriptionsResult.Payload.body"),
        ratings: stepfunctions.JsonPath.stringAt("$.parallelResults[1].ratingsResult.Payload.body"),
        downloads: stepfunctions.JsonPath.stringAt("$.parallelResults[2].downloadsResult.Payload.body"),
      }),
      resultPath: "$.feedResult",
    });

    const chain = stepfunctions.Chain.start(parallelState).next(generateFeedTask);

    const stateMachine = new stepfunctions.StateMachine(this, "GetFeedStateMachine", {
      definitionBody: stepfunctions.DefinitionBody.fromChainable(chain),
      timeout: cdk.Duration.minutes(5),
    });

    const arnParts = cdk.Arn.split(stateMachine.stateMachineArn, cdk.ArnFormat.COLON_RESOURCE_NAME);
    const executionArn = `arn:aws:states:${arnParts.region}:${arnParts.account}:execution:${arnParts.resourceName}:*`;

    const lambdaRole = new iam.Role(this, "LambdaExecutionRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")],
    });

    this.startAndPollStepFunctionFn = new lambda.Function(this, "startAndPollStepFunctionFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/start-and-poll-step-function")),
      environment: {
        GET_FEED_STATE_MACHINE_ARN: stateMachine.stateMachineArn,
      },
      timeout: cdk.Duration.seconds(15),
      role: lambdaRole,
    });

    stateMachine.grantStartExecution(this.startAndPollStepFunctionFn);
    stateMachine.grant(this.startAndPollStepFunctionFn, "states:DescribeExecution");

    const stepFunctionRole = new iam.Role(this, "StepFunctionRole", {
      assumedBy: new iam.ServicePrincipal("states.amazonaws.com"),
    });

    stepFunctionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AWSLambda_FullAccess"));

    stateMachine.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["lambda:InvokeFunction"],
        resources: [this.getSubscriptionsFn.functionArn, this.getRatingsFn.functionArn, this.getDownloadsFn.functionArn, this.generateFeedFn.functionArn],
      })
    );

    //this is important
    this.startAndPollStepFunctionFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["states:StartExecution", "states:DescribeExecution"],
        resources: [executionArn],
      })
    );

    this.handleTopicMessageFn = new lambda.Function(this, "handleTopicMessageFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/handle-topic-message")),
    });

    this.uploadMovieFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["sqs:SendMessage"],
        resources: ["*"], // Adjust as needed for more specific permissions
      })
    );

    this.subscribeFn.addToRolePolicy(
      new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["cognito-idp:AdminGetUser", "sns:*"],
        resources: ["*"],
      })
    );

    this.unsubscribeFn.addToRolePolicy(
      new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["cognito-idp:AdminGetUser", "sns:*"],
        resources: ["*"],
      })
    );

    this.handleTopicMessageFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["sns:*"],
        resources: ["*"],
      })
    );

    this.handleTopicMessageFn.addEventSource(new SqsEventSource(sqsQueue));

    sqsQueue.grantConsumeMessages(this.handleTopicMessageFn);

    moviesBucket.grantRead(this.downloadMovieFn);
    moviesBucket.grantRead(this.getMoviesFn);
    moviesBucket.grantRead(this.getSingleMovieFn);
    moviesBucket.grantRead(this.generateFeedFn);
    moviesBucket.grantReadWrite(this.uploadMovieFn);
    moviesBucket.grantReadWrite(this.deleteMovieFn);
    moviesBucket.grantReadWrite(this.editMovieFn);

    moviesDataTable.grantReadData(this.downloadMovieFn);
    moviesDataTable.grantReadData(this.getSingleMovieFn);
    moviesDataTable.grantReadData(this.getMoviesFn);
    moviesDataTable.grantReadWriteData(this.uploadMovieFn);
    moviesDataTable.grantReadWriteData(this.deleteMovieFn);
    moviesDataTable.grantReadWriteData(this.editMovieFn);
    moviesDataTable.grantReadData(this.generateFeedFn);

    subscriptionsDataTable.grantWriteData(this.subscribeFn);
    subscriptionsDataTable.grantReadData(this.getSubscriptionsFn);
    subscriptionsDataTable.grantWriteData(this.unsubscribeFn);

    movieRatingsTable.grantReadWriteData(this.rateMovieFn);
    movieRatingsTable.grantReadData(this.getSingleMovieFn);
    movieRatingsTable.grantReadData(this.getRatingsFn);
    movieRatingsTable.grantReadWriteData(this.deleteMovieFn);

    downloadsDataTable.grantReadWriteData(this.downloadMovieFn);
    downloadsDataTable.grantReadData(this.getDownloadsFn);
    downloadsDataTable.grantReadWriteData(this.deleteMovieFn);

    transcodedVideosBucket.grantReadWrite(this.deleteMovieFn);

    transcodingStatusTable.grantReadWriteData(this.deleteMovieFn);
  }
}
