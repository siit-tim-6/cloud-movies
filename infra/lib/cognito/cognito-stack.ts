import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import path = require("path");

export class CognitoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const userPool = new cognito.UserPool(this, "movieUserPool", {
      signInAliases: {
        username: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      selfSignUpEnabled: true,
      autoVerify: {
        email: true,
      },
      userVerification: {
        emailStyle: cognito.VerificationEmailStyle.LINK,
      },
      keepOriginal: {
        email: true,
      },
      standardAttributes: {
        givenName: {
          required: true,
        },
        familyName: {
          required: true,
        },
        birthdate: {
          required: true,
        },
        email: {
          required: true,
        },
      },
      email: cognito.UserPoolEmail.withCognito(),
    });

    const userPoolClient = userPool.addClient("briefCinemaFe", {
      preventUserExistenceErrors: true,
    });

    userPool.addDomain("briefCinemaCognitoDomain", {
      cognitoDomain: {
        domainPrefix: "briefcinemausersteo",
      },
    });

    const regularUserGroup = new cognito.CfnUserPoolGroup(this, "regularUserGroup", {
      userPoolId: userPool.userPoolId,
      groupName: "RegularUsers",
    });

    const adminUserGroup = new cognito.CfnUserPoolGroup(this, "adminUserGroup", {
      userPoolId: userPool.userPoolId,
      groupName: "Admins",
    });

    const addToDefaultUserGroupFn = new lambda.Function(this, "addToDefaultUserGroupFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.addToUserGroup",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src")),
    });

    addToDefaultUserGroupFn.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["cognito-identity:*", "cognito-sync:*", "cognito-idp:*"],
        resources: ["*"],
      })
    );

    userPool.addTrigger(cognito.UserPoolOperation.POST_CONFIRMATION, addToDefaultUserGroupFn);
  }
}