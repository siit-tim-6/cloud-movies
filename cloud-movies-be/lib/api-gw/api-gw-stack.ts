import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import path = require("path");

export class ApiGwStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const moviesDataTable = new dynamodb.Table(this, "MoviesData", {
      partitionKey: { name: "MovieId", type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    moviesDataTable.addGlobalSecondaryIndex({
      indexName: "descriptionSearch",
      partitionKey: { name: "LowerDescription", type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1,
    });

    moviesDataTable.addGlobalSecondaryIndex({
      indexName: "titleDescriptionSearch",
      partitionKey: { name: "TitleDescriptionSearch", type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1,
    });

    const moviesBucket = new s3.Bucket(this, "MoviesBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedOrigins: ["*"],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST, s3.HttpMethods.DELETE],
          allowedHeaders: ["*"],
        },
      ],
    });

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

    const getAllMoviesFn = new lambda.Function(this, "getAllMoviesFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/get-all-movies")),
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

    const searchMoviesFn = new lambda.Function(this, "searchMoviesFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/search-movies")),
      environment: {
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

    moviesBucket.grantRead(downloadMovieFn);
    moviesBucket.grantRead(getAllMoviesFn);
    moviesBucket.grantRead(getSingleMovieFn);
    moviesBucket.grantReadWrite(uploadMovieFn);
    moviesBucket.grantReadWrite(deleteMovieFn);

    moviesDataTable.grantReadData(downloadMovieFn);
    moviesDataTable.grantReadData(getAllMoviesFn);
    moviesDataTable.grantReadData(getSingleMovieFn);
    moviesDataTable.grantReadData(searchMoviesFn);
    moviesDataTable.grantReadWriteData(uploadMovieFn);
    moviesDataTable.grantReadWriteData(deleteMovieFn);

    const api = new apigateway.RestApi(this, "MoviesApi", {
      restApiName: "Movies Service",
      description: "This service serves movies.",
      cloudWatchRole: true,
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

    const uploadMovieLambdaIntegration = new apigateway.LambdaIntegration(uploadMovieFn);
    const uploadMovieResource = api.root.addResource("upload-movie");
    uploadMovieResource.addMethod("POST", uploadMovieLambdaIntegration, {
      requestModels: {
        "application/json": uploadMovieRequestBodySchema,
      },
      requestValidatorOptions: {
        validateRequestBody: true,
      },
    });
    uploadMovieResource.addCorsPreflight({
      allowOrigins: ["*"],
    });

    const downloadMovieLambdaIntegration = new apigateway.LambdaIntegration(downloadMovieFn);
    const downloadMovieResource = api.root.addResource("download-movie");
    downloadMovieResource.addMethod("GET", downloadMovieLambdaIntegration, {
      requestParameters: {
        "method.request.querystring.movieId": true,
      },
      requestValidatorOptions: {
        validateRequestParameters: true,
      },
    });

    const moviesResource = api.root.addResource("movies");
    const getAllMoviesLambdaIntegration = new apigateway.LambdaIntegration(getAllMoviesFn);
    moviesResource.addMethod("GET", getAllMoviesLambdaIntegration);

    const movieResource = moviesResource.addResource("{id}");
    const getSingleMovieLambdaIntegration = new apigateway.LambdaIntegration(getSingleMovieFn);
    movieResource.addMethod("GET", getSingleMovieLambdaIntegration, {
      requestParameters: {
        "method.request.path.id": true,
      },
      requestValidatorOptions: {
        validateRequestParameters: true,
      },
    });

    const searchMoviesLambdaIntegration = new apigateway.LambdaIntegration(searchMoviesFn);
    const searchMoviesResource = api.root.addResource("search-movies");
    searchMoviesResource.addMethod("GET", searchMoviesLambdaIntegration, {
      requestParameters: {
        "method.request.path.title": false,
        "method.request.path.description": false,
        "method.request.path.actors": false,
        "method.request.path.directors": false,
        "method.request.path.genres": false,
      },
      requestValidatorOptions: {
        validateRequestParameters: true,
      },
    });

    const deleteMovieLambdaIntegration = new apigateway.LambdaIntegration(deleteMovieFn);
    movieResource.addMethod("DELETE", deleteMovieLambdaIntegration, {
      requestParameters: {
        "method.request.path.id": true,
      },
      requestValidatorOptions: {
        validateRequestParameters: true,
      },
    });
    movieResource.addCorsPreflight({
      allowOrigins: ["*"],
    });

    // subscription related things
    const subscriptionsDataTable = new dynamodb.Table(this, "SubscriptionsData", {
      partitionKey: { name: "UserId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SubscribedTo", type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1,
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

    const unsubscibeFn = new lambda.Function(this, "unsubscribeFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/unsubscribe")),
      environment: {
        DYNAMODB_TABLE: subscriptionsDataTable.tableName,
      },
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

    const subscribeLambdaIntegration = new apigateway.LambdaIntegration(subscribeFn);
    const subscriptionsResource = api.root.addResource("subscriptions");
    subscriptionsResource.addMethod("POST", subscribeLambdaIntegration, {
      requestModels: {
        "application/json": subscribeRequestBodySchema,
      },
      requestValidatorOptions: {
        validateRequestBody: true,
      },
    });
    subscriptionsResource.addCorsPreflight({
      allowOrigins: ["*"],
    });

    const getSubscriptionsLambdaIntegration = new apigateway.LambdaIntegration(getSubscriptionsFn);
    subscriptionsResource.addMethod("GET", getSubscriptionsLambdaIntegration);

    const unsubscribeLambdaIntegration = new apigateway.LambdaIntegration(unsubscibeFn);
    subscriptionsResource.addMethod("DELETE", unsubscribeLambdaIntegration, {
      requestParameters: {
        "method.request.querystring.subscribedTo": true,
      },
      requestValidatorOptions: {
        validateRequestParameters: true,
      },
    });

    subscriptionsDataTable.grantWriteData(subscribeFn);
    subscriptionsDataTable.grantReadData(getSubscriptionsFn);
    subscriptionsDataTable.grantWriteData(unsubscibeFn);
  }
}
