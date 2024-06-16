#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CognitoStack } from "../lib/cognito/cognito-stack";
import { ApiGwStack } from "../lib/api-gw/api-gw-stack";
import { FrontDeploymentStack } from "../lib/front-deployment/front-deployment-stack";

const app = new cdk.App();

new CognitoStack(app, "CognitoStack", {});
new ApiGwStack(app, "ApiGwStack", {});
new FrontDeploymentStack(app, "FrontDeploymentStack", {});

app.synth();
