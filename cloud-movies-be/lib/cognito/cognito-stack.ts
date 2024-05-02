import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

export class CognitoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const userPool = new cognito.UserPool(this, "movieUserPool", {
      signInAliases: {
        preferredUsername: true,
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
        preferredUsername: {
          required: true,
        },
        email: {
          required: true,
        },
      },
      email: cognito.UserPoolEmail.withCognito(),
    });

    userPool.addClient("briefCinemaFe", {
      preventUserExistenceErrors: true,
    });

    userPool.addDomain("briefCinemaCognitoDomain", {
      cognitoDomain: {
        domainPrefix: "briefcinemausers",
      },
    });
  }
}
