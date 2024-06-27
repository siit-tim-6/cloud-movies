#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CognitoStack } from "../lib/cognito/cognito-stack";
import { ApiGwStack } from "../lib/api-gw/api-gw-stack";
import { FrontDeploymentStack } from "../lib/front-deployment/front-deployment-stack";
import { DataStack } from "../lib/data/data-stack";
import { LambdaStack } from "../lib/lambda/lambda-stack";

const app = new cdk.App();

new CognitoStack(app, "CognitoStack", {});
const dataStack = new DataStack(app, "DataStack", {});
const lambdaStack = new LambdaStack(app, "LambdaStack", {
  moviesBucket: dataStack.moviesBucket,
  moviesDataTable: dataStack.moviesDataTable,
  subscriptionsDataTable: dataStack.subscriptionsDataTable,
});
new ApiGwStack(app, "ApiGwStack", {});
new FrontDeploymentStack(app, "FrontDeploymentStack", {});

app.synth();
