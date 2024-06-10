import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import path = require("path");
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

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

    const moviesDataTable = new dynamodb.Table(this, "MoviesData", {
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1,
    });

    const moviesBucket = new s3.Bucket(this, "MoviesBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedOrigins: ['*'],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          allowedHeaders: ['*'],
        },
      ],
    });

    const uploadMovieFn = new lambda.Function(this, "uploadMovieFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "upload-movie.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src")),
      environment: {
        S3_BUCKET: moviesBucket.bucketName,
        DYNAMODB_TABLE: moviesDataTable.tableName,
      },
    });

    const downloadMovieFn = new lambda.Function(this, "downloadMovieFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "download-movie.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src")),
      environment: {
        S3_BUCKET: moviesBucket.bucketName,
        DYNAMODB_TABLE: moviesDataTable.tableName,
      },
    });

    const getMoviesFn = new lambda.Function(this, "getMoviesFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "get-movies.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src")),
      environment: {
        DYNAMODB_TABLE: moviesDataTable.tableName,
      },
    });

    moviesBucket.grantReadWrite(uploadMovieFn);
    moviesBucket.grantReadWrite(downloadMovieFn);
    moviesDataTable.grantReadWriteData(uploadMovieFn);
    moviesDataTable.grantReadWriteData(downloadMovieFn);
    moviesDataTable.grantReadData(getMoviesFn);

    uploadMovieFn.addToRolePolicy(
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["s3:*", "dynamodb:*"],
          resources: [moviesBucket.bucketArn, moviesDataTable.tableArn],
        })
    );

    downloadMovieFn.addToRolePolicy(
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["s3:*", "dynamodb:*"],
          resources: [moviesBucket.bucketArn, moviesDataTable.tableArn],
        })
    );

    getMoviesFn.addToRolePolicy(
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["dynamodb:Scan"],
          resources: [moviesDataTable.tableArn],
        })
    );

    const api = new apigateway.RestApi(this, "MoviesApi", {
      restApiName: "Movies Service",
      description: "This service serves movies.",
    });

    const addCorsOptions = (apiResource: apigateway.IResource) => {
      apiResource.addMethod('OPTIONS', new apigateway.MockIntegration({
        integrationResponses: [{
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'",
            'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
          },
        }],
        passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
        requestTemplates: {
          'application/json': '{"statusCode": 200}'
        },
      }), {
        methodResponses: [{
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Methods': true,
            'method.response.header.Access-Control-Allow-Headers': true,
          },
        }],
      });
    };

    const uploadMovieIntegration = new apigateway.LambdaIntegration(uploadMovieFn);
    const downloadMovieIntegration = new apigateway.LambdaIntegration(downloadMovieFn);
    const getMoviesIntegration = new apigateway.LambdaIntegration(getMoviesFn);

    const uploadMovie = api.root.addResource('upload-movie');
    uploadMovie.addMethod('POST', new apigateway.LambdaIntegration(uploadMovieFn, {
      proxy: false,
      integrationResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': "'*'",
          'method.response.header.Access-Control-Allow-Methods': "'POST,OPTIONS'",
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
        },
      }],
    }), {
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Headers': true,
        },
      }],
    });

    addCorsOptions(uploadMovie);

    const downloadMovieResource = api.root.addResource("download-movie");
    downloadMovieResource.addMethod("GET", downloadMovieIntegration);

    const getMoviesResource = api.root.addResource("movies");
    getMoviesResource.addMethod("GET", getMoviesIntegration);
  }
}
