import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cognito from "aws-cdk-lib/aws-cognito";
import path = require("path");

export interface ApiGwStackProps extends cdk.StackProps {
  uploadMovieFn: lambda.Function;
  downloadMovieFn: lambda.Function;
  getSingleMovieFn: lambda.Function;
  getMoviesFn: lambda.Function;
  deleteMovieFn: lambda.Function;
  subscribeFn: lambda.Function;
  getSubscriptionsFn: lambda.Function;
  unsubscribeFn: lambda.Function;
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
}

export class ApiGwStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: ApiGwStackProps) {
    super(scope, id, props);

    const {
      uploadMovieFn,
      downloadMovieFn,
      getSingleMovieFn,
      getMoviesFn,
      deleteMovieFn,
      subscribeFn,
      getSubscriptionsFn,
      unsubscribeFn,
      userPool,
      userPoolClient,
    } = props!;

    const userAuthorizerFn = new lambda.Function(this, "userAuthorizerFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/user-authorizer")),
      environment: {
        USER_POOL_ID: userPool.userPoolId,
        CLIENT_ID: userPoolClient.userPoolClientId,
      },
    });

    const adminAuthorizerFn = new lambda.Function(this, "adminAuthorizerFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/admin-authorizer")),
      environment: {
        USER_POOL_ID: userPool.userPoolId,
        CLIENT_ID: userPoolClient.userPoolClientId,
      },
    });

    const allAuthorizerFn = new lambda.Function(this, "allAuthorizerFn", {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "index.handler",
        code: lambda.Code.fromAsset(path.join(__dirname, "./src/all-authorizer")),
        environment: {
            USER_POOL_ID: userPool.userPoolId,
            CLIENT_ID: userPoolClient.userPoolClientId,
        },
    });

    const userAuth = new apigateway.TokenAuthorizer(this, "userAuthorizer", {
      handler: userAuthorizerFn,
    });

    const adminAuth = new apigateway.TokenAuthorizer(this, "adminAuthorizer", {
      handler: adminAuthorizerFn,
    });

    const allAuth = new apigateway.TokenAuthorizer(this, "allAuthorizer", {
        handler: allAuthorizerFn,
    });

    const uploadMovieLambdaIntegration = new apigateway.LambdaIntegration(uploadMovieFn);
    const downloadMovieLambdaIntegration = new apigateway.LambdaIntegration(downloadMovieFn);
    const getSingleMovieLambdaIntegration = new apigateway.LambdaIntegration(getSingleMovieFn);
    const getMoviesLambdaIntegration = new apigateway.LambdaIntegration(getMoviesFn);
    const deleteMovieLambdaIntegration = new apigateway.LambdaIntegration(deleteMovieFn);
    const subscribeLambdaIntegration = new apigateway.LambdaIntegration(subscribeFn);
    const getSubscriptionsLambdaIntegration = new apigateway.LambdaIntegration(getSubscriptionsFn);
    const unsubscribeLambdaIntegration = new apigateway.LambdaIntegration(unsubscribeFn);

    const api = new apigateway.RestApi(this, "MoviesApi", {
      restApiName: "Movies Service",
      description: "This service serves movies.",
      cloudWatchRole: true,
    });

    const downloadMovieResource = api.root.addResource("download-movie");
    downloadMovieResource.addMethod("GET", downloadMovieLambdaIntegration, {
      requestParameters: {
        "method.request.querystring.movieId": true,
      },
      requestValidatorOptions: {
        validateRequestParameters: true,
      },
      authorizer: userAuth,
    });
    downloadMovieResource.addCorsPreflight({
      allowOrigins: ["*"],
    });

    const uploadMovieRequestBodySchema = new apigateway.Model(this, "uploadMovieRequestBodySchema", {
      restApi: api,
      contentType: "application/json",
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        properties: {
          title: { type: apigateway.JsonSchemaType.STRING },
          description: { type: apigateway.JsonSchemaType.STRING },
          genres: { type: apigateway.JsonSchemaType.ARRAY },
          actors: { type: apigateway.JsonSchemaType.ARRAY },
          directors: { type: apigateway.JsonSchemaType.ARRAY },
          coverFileName: { type: apigateway.JsonSchemaType.STRING },
          coverFileType: { type: apigateway.JsonSchemaType.STRING },
          videoFileName: { type: apigateway.JsonSchemaType.STRING },
          videoFileType: { type: apigateway.JsonSchemaType.STRING },
        },
        required: ["title", "description", "genres", "actors", "directors", "coverFileName", "coverFileType", "videoFileName", "videoFileType"],
      },
    });

    const moviesResource = api.root.addResource("movies");
    moviesResource.addMethod("GET", getMoviesLambdaIntegration, {
      requestParameters: {
        "method.request.path.title": false,
        "method.request.path.description": false,
        "method.request.path.actor": false,
        "method.request.path.director": false,
        "method.request.path.genre": false,
      },
      requestValidatorOptions: {
        validateRequestParameters: true,
      },
      authorizer: allAuth,
    });
    moviesResource.addMethod("POST", uploadMovieLambdaIntegration, {
      requestModels: {
        "application/json": uploadMovieRequestBodySchema,
      },
      requestValidatorOptions: {
        validateRequestBody: true,
      },
      authorizer: adminAuth,
    });
    moviesResource.addCorsPreflight({
      allowOrigins: ["*"],
    });

    const movieResource = moviesResource.addResource("{id}");
    movieResource.addMethod("GET", getSingleMovieLambdaIntegration, {
      requestParameters: {
        "method.request.path.id": true,
      },
      requestValidatorOptions: {
        validateRequestParameters: true,
      },
      authorizer: allAuth,
    });
    movieResource.addMethod("DELETE", deleteMovieLambdaIntegration, {
      requestParameters: {
        "method.request.path.id": true,
      },
      requestValidatorOptions: {
        validateRequestParameters: true,
      },
      authorizer: adminAuth,
    });
    movieResource.addCorsPreflight({
      allowOrigins: ["*"],
    });

    const subscribeRequestBodySchema = new apigateway.Model(this, "subscribeRequestBodySchema", {
      restApi: api,
      contentType: "application/json",
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        properties: {
          subscribedTo: { type: apigateway.JsonSchemaType.STRING },
        },
        required: ["subscribedTo"],
      },
    });

    const subscriptionsResource = api.root.addResource("subscriptions");
    subscriptionsResource.addMethod("POST", subscribeLambdaIntegration, {
      requestModels: {
        "application/json": subscribeRequestBodySchema,
      },
      requestValidatorOptions: {
        validateRequestBody: true,
      },
      authorizer: allAuth,
    });
    subscriptionsResource.addCorsPreflight({
      allowOrigins: ["*"],
    });
    subscriptionsResource.addMethod("GET", getSubscriptionsLambdaIntegration, {
      authorizer: allAuth,
    });
    subscriptionsResource.addMethod("DELETE", unsubscribeLambdaIntegration, {
      requestParameters: {
        "method.request.querystring.subscribedTo": true,
      },
      requestValidatorOptions: {
        validateRequestParameters: true,
      },
      authorizer: allAuth,
    });
  }
}
