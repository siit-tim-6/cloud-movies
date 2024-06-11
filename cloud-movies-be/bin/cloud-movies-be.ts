#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CognitoStack } from "../lib/cognito/cognito-stack";
import { ApiGwStack } from "../lib/api-gw/api-gw-stack";

const app = new cdk.App();

new CognitoStack(app, "CognitoStack", {});
new ApiGwStack(app, "ApiGwStack", {});

app.synth();
