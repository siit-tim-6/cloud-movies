#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CognitoStack } from "../lib/cognito/cognito-stack";
import { ApiGwStack } from "../lib/api-gw/api-gw-stack";
import { FrontDeploymentStack } from "../lib/front-deployment/front-deployment-stack";
import { DataStack } from "../lib/data/data-stack";
import { LambdaStack } from "../lib/lambda/lambda-stack";
import {SqsStack} from "../lib/sqs/sqs-stack";

const app = new cdk.App();

const cognitoStack = new CognitoStack(app, "CognitoStack", {});

const dataStack = new DataStack(app, "DataStack", {});

const sqsStack = new SqsStack(app, "SqsStack", {});

const lambdaStack = new LambdaStack(app, "LambdaStack", {
  moviesBucket: dataStack.moviesBucket,
  moviesDataTable: dataStack.moviesDataTable,
  subscriptionsDataTable: dataStack.subscriptionsDataTable,
  movieRatingsTable: dataStack.movieRatingsTable,
  downloadsDataTable: dataStack.downloadsDataTable,
  cognitoUserPool: cognitoStack.userPool,
  sqsQueue: sqsStack.queue,
  feedsDataTable: dataStack.feedsDataTable,
  feedQueue: sqsStack.feedQueue,
});

new ApiGwStack(app, "ApiGwStack", {
  uploadMovieFn: lambdaStack.uploadMovieFn,
  downloadMovieFn: lambdaStack.downloadMovieFn,
  getMoviesFn: lambdaStack.getMoviesFn,
  deleteMovieFn: lambdaStack.deleteMovieFn,
  getSingleMovieFn: lambdaStack.getSingleMovieFn,
  getSubscriptionsFn: lambdaStack.getSubscriptionsFn,
  subscribeFn: lambdaStack.subscribeFn,
  unsubscribeFn: lambdaStack.unsubscribeFn,
  editMovieFn: lambdaStack.editMovieFn,
  rateMovieFn: lambdaStack.rateMovieFn,
  getFeedFn: lambdaStack.getFeedFn,
});

new FrontDeploymentStack(app, "FrontDeploymentStack", {});

app.synth();
