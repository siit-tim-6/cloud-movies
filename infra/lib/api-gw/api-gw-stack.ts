import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";

export interface ApiGwStackProps extends cdk.StackProps {
  uploadMovieFn: lambda.Function;
  downloadMovieFn: lambda.Function;
  getSingleMovieFn: lambda.Function;
  getMoviesFn: lambda.Function;
  deleteMovieFn: lambda.Function;
  subscribeFn: lambda.Function;
  getSubscriptionsFn: lambda.Function;
  unsubscribeFn: lambda.Function;
  editMovieFn: lambda.Function;
  rateMovieFn: lambda.Function;
}

export class ApiGwStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: ApiGwStackProps) {
    super(scope, id, props);

    const { uploadMovieFn, downloadMovieFn, getSingleMovieFn, getMoviesFn, deleteMovieFn, subscribeFn, getSubscriptionsFn, unsubscribeFn, editMovieFn, rateMovieFn } = props!;

    const uploadMovieLambdaIntegration = new apigateway.LambdaIntegration(uploadMovieFn);
    const downloadMovieLambdaIntegration = new apigateway.LambdaIntegration(downloadMovieFn);
    const getSingleMovieLambdaIntegration = new apigateway.LambdaIntegration(getSingleMovieFn);
    const getMoviesLambdaIntegration = new apigateway.LambdaIntegration(getMoviesFn);
    const deleteMovieLambdaIntegration = new apigateway.LambdaIntegration(deleteMovieFn);
    const subscribeLambdaIntegration = new apigateway.LambdaIntegration(subscribeFn);
    const getSubscriptionsLambdaIntegration = new apigateway.LambdaIntegration(getSubscriptionsFn);
    const unsubscribeLambdaIntegration = new apigateway.LambdaIntegration(unsubscribeFn);
    const editMovieLambdaIntegration = new apigateway.LambdaIntegration(editMovieFn);
    const rateMovieLambdaIntegration = new apigateway.LambdaIntegration(rateMovieFn);

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
    });
    moviesResource.addMethod("POST", uploadMovieLambdaIntegration, {
      requestModels: {
        "application/json": uploadMovieRequestBodySchema,
      },
      requestValidatorOptions: {
        validateRequestBody: true,
      },
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
    });
    movieResource.addMethod("DELETE", deleteMovieLambdaIntegration, {
      requestParameters: {
        "method.request.path.id": true,
      },
      requestValidatorOptions: {
        validateRequestParameters: true,
      },
    });
    movieResource.addMethod("PUT", editMovieLambdaIntegration, {
      requestModels: {
        "application/json": uploadMovieRequestBodySchema,
      },
      requestValidatorOptions: {
        validateRequestBody: true,
      },
      requestParameters: {
        "method.request.path.id": true,
      },
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
    });
    subscriptionsResource.addCorsPreflight({
      allowOrigins: ["*"],
    });
    subscriptionsResource.addMethod("GET", getSubscriptionsLambdaIntegration);
    subscriptionsResource.addMethod("DELETE", unsubscribeLambdaIntegration, {
      requestParameters: {
        "method.request.querystring.subscribedTo": true,
      },
      requestValidatorOptions: {
        validateRequestParameters: true,
      },
    });

    const rateMovieRequestBodySchema = new apigateway.Model(this, "rateMovieRequestBodySchema", {
      restApi: api,
      contentType: "application/json",
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        properties: {
          movieId: { type: apigateway.JsonSchemaType.STRING },
          rating: { type: apigateway.JsonSchemaType.NUMBER },
        },
        required: ["movieId", "rating"],
      },
    });

    const rateMovieResource = api.root.addResource("rate-movie");
    rateMovieResource.addMethod("POST", rateMovieLambdaIntegration, {
      requestModels: {
        "application/json": rateMovieRequestBodySchema,
      },
      requestValidatorOptions: {
        validateRequestBody: true,
      },
    });
    rateMovieResource.addCorsPreflight({
      allowOrigins: ["*"],
    });
  }
}
