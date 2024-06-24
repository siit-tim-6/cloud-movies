import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import path = require("path");
import * as iam from "aws-cdk-lib/aws-iam";

export class ApiGwStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const moviesDataTable = new dynamodb.Table(this, "MoviesData", {
      partitionKey: { name: "MovieId", type: dynamodb.AttributeType.STRING },
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

    uploadMovieFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['s3:PutObject', 's3:GetObject'],
      resources: [`${moviesBucket.bucketArn}/*`],
    }));

    moviesBucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.ArnPrincipal(uploadMovieFn.role!.roleArn)],
      actions: ['s3:PutObject'],
      resources: [`${moviesBucket.bucketArn}/*`],
    }));

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
        DYNAMODB_TABLE: moviesDataTable.tableName,
      },
    });

    const getSingleMovieFn = new lambda.Function(this, "getSingleMovieFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./src/get-single-movie")),
      environment: {
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

    const deleteMovieFn = new lambda.Function(this, 'deleteMovieFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, './src/delete-movie')),
      environment: {
        S3_BUCKET: moviesBucket.bucketName,
        DYNAMODB_TABLE: moviesDataTable.tableName,
      },
      timeout: cdk.Duration.seconds(10)
    });

    const updateMovieFn = new lambda.Function(this, 'updateMovieFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, './src/update-movie')),
      environment: {
        S3_BUCKET: moviesBucket.bucketName,
        DYNAMODB_TABLE: moviesDataTable.tableName,
      },
      timeout: cdk.Duration.seconds(10),
    });

    updateMovieFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
      resources: [`${moviesBucket.bucketArn}/*`],
    }));

    moviesBucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.ArnPrincipal(updateMovieFn.role!.roleArn)],
      actions: ['s3:PutObject', 's3:DeleteObject'],
      resources: [`${moviesBucket.bucketArn}/*`],
    }));

    moviesBucket.grantRead(uploadMovieFn);
    moviesBucket.grantRead(downloadMovieFn);
    moviesBucket.grantReadWrite(deleteMovieFn);
    moviesBucket.grantReadWrite(updateMovieFn);
    moviesDataTable.grantWriteData(uploadMovieFn);
    moviesDataTable.grantWriteData(uploadMovieFn);
    moviesDataTable.grantReadData(downloadMovieFn);
    moviesDataTable.grantReadData(getAllMoviesFn);
    moviesDataTable.grantReadData(getSingleMovieFn);
    moviesDataTable.grantReadData(searchMoviesFn);
    moviesDataTable.grantReadWriteData(uploadMovieFn);
    moviesDataTable.grantReadWriteData(deleteMovieFn);
    moviesDataTable.grantReadWriteData(updateMovieFn);

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
          genre: { type: apigateway.JsonSchemaType.STRING },
          actors: { type: apigateway.JsonSchemaType.STRING },
          directors: { type: apigateway.JsonSchemaType.STRING },
          coverFileName: { type: apigateway.JsonSchemaType.STRING },
          coverFileType: { type: apigateway.JsonSchemaType.STRING },
          videoFileName: { type: apigateway.JsonSchemaType.STRING },
          videoFileType: { type: apigateway.JsonSchemaType.STRING },
        },
        required: ["title", "description", "genre", "actors", "directors", "coverFileName", "coverFileType", "videoFileName", "videoFileType"],
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
    searchMoviesResource.addMethod("POST", searchMoviesLambdaIntegration, {
      requestValidatorOptions: {
        validateRequestBody: true,
      },
    });

    const deleteMovieLambdaIntegration = new apigateway.LambdaIntegration(deleteMovieFn);
    movieResource.addMethod('DELETE', deleteMovieLambdaIntegration, {
      requestParameters: {
        'method.request.path.id': true,
      },
      requestValidatorOptions: {
        validateRequestParameters: true,
      },
    });


    const updateMovieLambdaIntegration = new apigateway.LambdaIntegration(updateMovieFn);
    movieResource.addMethod('PUT', updateMovieLambdaIntegration, {
      requestValidatorOptions: {
        validateRequestBody: true,
      },
      requestParameters: {
        'method.request.path.id': true,
      },
    });
  }
}
