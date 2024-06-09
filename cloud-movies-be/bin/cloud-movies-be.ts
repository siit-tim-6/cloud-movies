#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CognitoStack } from "../lib/cognito/cognito-stack";

const app = new cdk.App();

new CognitoStack(app, "CognitoStack", {});
