import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import path = require("path");

export interface LambdaStackProps extends cdk.StackProps {
  moviesDataTable: dynamodb.Table;
  subscriptionsDataTable: dynamodb.Table;
  moviesBucket: s3.Bucket;
}

export class LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: LambdaStackProps) {
    super(scope, id, props);

    const { moviesBucket, moviesDataTable, subscriptionsDataTable } = props!;

    const uploadMovieFn = new lambda.Function(this, "uploadMovieFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/upload-movie")),
      environment: {
        S3_BUCKET: moviesBucket.bucketName,
        DYNAMODB_TABLE: moviesDataTable.tableName,
      },
    });

    const downloadMovieFn = new lambda.Function(this, "downloadMovieFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/download-movie")),
      environment: {
        S3_BUCKET: moviesBucket.bucketName,
        DYNAMODB_TABLE: moviesDataTable.tableName,
      },
    });

    const getSingleMovieFn = new lambda.Function(this, "getSingleMovieFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/get-single-movie")),
      environment: {
        S3_BUCKET: moviesBucket.bucketName,
        DYNAMODB_TABLE: moviesDataTable.tableName,
      },
    });

    const getMoviesFn = new lambda.Function(this, "getMoviesFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/get-movies")),
      environment: {
        S3_BUCKET: moviesBucket.bucketName,
        DYNAMODB_TABLE: moviesDataTable.tableName,
      },
    });

    const deleteMovieFn = new lambda.Function(this, "deleteMovieFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/delete-movie")),
      environment: {
        S3_BUCKET: moviesBucket.bucketName,
        DYNAMODB_TABLE: moviesDataTable.tableName,
      },
      timeout: cdk.Duration.seconds(10),
    });

    const subscribeFn = new lambda.Function(this, "subscribeFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/subscribe")),
      environment: {
        DYNAMODB_TABLE: subscriptionsDataTable.tableName,
      },
    });

    const getSubscriptionsFn = new lambda.Function(this, "getSubscriptionsFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/get-subscriptions")),
      environment: {
        DYNAMODB_TABLE: subscriptionsDataTable.tableName,
      },
    });

    const unsubscribeFn = new lambda.Function(this, "unsubscribeFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/unsubscribe")),
      environment: {
        DYNAMODB_TABLE: subscriptionsDataTable.tableName,
      },
    });

    moviesBucket.grantRead(downloadMovieFn);
    moviesBucket.grantRead(getMoviesFn);
    moviesBucket.grantRead(getSingleMovieFn);
    moviesBucket.grantReadWrite(uploadMovieFn);
    moviesBucket.grantReadWrite(deleteMovieFn);

    moviesDataTable.grantReadData(downloadMovieFn);
    moviesDataTable.grantReadData(getSingleMovieFn);
    moviesDataTable.grantReadData(getMoviesFn);
    moviesDataTable.grantReadWriteData(uploadMovieFn);
    moviesDataTable.grantReadWriteData(deleteMovieFn);

    subscriptionsDataTable.grantWriteData(subscribeFn);
    subscriptionsDataTable.grantReadData(getSubscriptionsFn);
    subscriptionsDataTable.grantWriteData(unsubscribeFn);

    new cdk.CfnOutput(this, "uploadMovieFnArn", {
      exportName: "uploadMovieFnArn",
      value: uploadMovieFn.functionArn,
    });

    new cdk.CfnOutput(this, "downloadMovieFnArn", {
      exportName: "downloadMovieFnArn",
      value: downloadMovieFn.functionArn,
    });

    new cdk.CfnOutput(this, "getSingleMovieFnArn", {
      exportName: "getSingleMovieFnArn",
      value: getSingleMovieFn.functionArn,
    });

    new cdk.CfnOutput(this, "getMoviesFnArn", {
      exportName: "getMoviesFnArn",
      value: getMoviesFn.functionArn,
    });

    new cdk.CfnOutput(this, "deleteMovieFnArn", {
      exportName: "deleteMovieFnArn",
      value: deleteMovieFn.functionArn,
    });

    new cdk.CfnOutput(this, "subscribeFnArn", {
      exportName: "subscribeFnArn",
      value: subscribeFn.functionArn,
    });

    new cdk.CfnOutput(this, "getSubscriptionsFnArn", {
      exportName: "getSubscriptionsFnArn",
      value: getSubscriptionsFn.functionArn,
    });

    new cdk.CfnOutput(this, "unsubscribeFnArn", {
      exportName: "unsubscribeFnArn",
      value: unsubscribeFn.functionArn,
    });
  }
}
