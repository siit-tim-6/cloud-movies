import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import path = require("path");

export interface LambdaStackProps extends cdk.StackProps {
  moviesDataTable: dynamodb.Table;
  subscriptionsDataTable: dynamodb.Table;
  moviesBucket: s3.Bucket;
  movieRatingsTable: dynamodb.Table;
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

  constructor(scope: Construct, id: string, props?: LambdaStackProps) {
    super(scope, id, props);

    const { moviesBucket, moviesDataTable, subscriptionsDataTable, movieRatingsTable } = props!;

    this.uploadMovieFn = new lambda.Function(this, "uploadMovieFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/upload-movie")),
      environment: {
        S3_BUCKET: moviesBucket.bucketName,
        DYNAMODB_TABLE: moviesDataTable.tableName,
      },
    });

    this.downloadMovieFn = new lambda.Function(this, "downloadMovieFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/download-movie")),
      environment: {
        S3_BUCKET: moviesBucket.bucketName,
        DYNAMODB_TABLE: moviesDataTable.tableName,
      },
    });

    this.getSingleMovieFn = new lambda.Function(this, "getSingleMovieFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/get-single-movie")),
      environment: {
        S3_BUCKET: moviesBucket.bucketName,
        DYNAMODB_TABLE: moviesDataTable.tableName,
        RATINGS_TABLE: movieRatingsTable.tableName
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
      },
      timeout: cdk.Duration.seconds(10),
    });

    this.subscribeFn = new lambda.Function(this, "subscribeFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/subscribe")),
      environment: {
        DYNAMODB_TABLE: subscriptionsDataTable.tableName,
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

    // Add SNS permissions to the uploadMovieFn
    this.uploadMovieFn.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'sns:ListTopics',
        'sns:CreateTopic',
        'sns:Publish',
      ],
      resources: ['*'], // Adjust as needed for more specific permissions
    }));


    moviesBucket.grantRead(this.downloadMovieFn);
    moviesBucket.grantRead(this.getMoviesFn);
    moviesBucket.grantRead(this.getSingleMovieFn);
    moviesBucket.grantReadWrite(this.uploadMovieFn);
    moviesBucket.grantReadWrite(this.deleteMovieFn);
    moviesBucket.grantReadWrite(this.editMovieFn);

    moviesDataTable.grantReadData(this.downloadMovieFn);
    moviesDataTable.grantReadData(this.getSingleMovieFn);
    moviesDataTable.grantReadData(this.getMoviesFn);
    moviesDataTable.grantReadWriteData(this.uploadMovieFn);
    moviesDataTable.grantReadWriteData(this.deleteMovieFn);
    moviesDataTable.grantReadWriteData(this.editMovieFn);

    subscriptionsDataTable.grantWriteData(this.subscribeFn);
    subscriptionsDataTable.grantReadData(this.getSubscriptionsFn);
    subscriptionsDataTable.grantWriteData(this.unsubscribeFn);

    movieRatingsTable.grantReadWriteData(this.rateMovieFn);
    movieRatingsTable.grantReadData(this.getSingleMovieFn);
  }
}
