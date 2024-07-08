import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";

export class DataStack extends cdk.Stack {
  public readonly moviesDataTable: dynamodb.Table;
  public readonly subscriptionsDataTable: dynamodb.Table;
  public readonly moviesBucket: s3.Bucket;
  public readonly movieRatingsTable: dynamodb.Table;
  public readonly transcodedVideosBucket: s3.Bucket;
  public readonly transcodingStatusTable: dynamodb.Table;
  public readonly transcodingQueue: sqs.Queue;
  public readonly downloadsDataTable: dynamodb.Table;
  public readonly feedsDataTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.moviesDataTable = new dynamodb.Table(this, "MoviesData", {
      partitionKey: { name: "MovieId", type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.moviesDataTable.addGlobalSecondaryIndex({
      indexName: "titleSearch",
      partitionKey: { name: "LowerTitle", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "LowerDescription", type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1,
    });

    this.moviesDataTable.addGlobalSecondaryIndex({
      indexName: "descriptionSearch",
      partitionKey: { name: "LowerDescription", type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1,
    });

    this.subscriptionsDataTable = new dynamodb.Table(this, "SubscriptionsData", {
      partitionKey: { name: "UserId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SubscribedTo", type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.subscriptionsDataTable.addGlobalSecondaryIndex({
      indexName: "SubscribedToSearch",
      partitionKey: { name: "SubscribedTo", type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1,
    });

    this.moviesBucket = new s3.Bucket(this, "MoviesBucket", {
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

    this.movieRatingsTable = new dynamodb.Table(this, "MovieRatings", {
      partitionKey: { name: "MovieId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "UserId", type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.transcodedVideosBucket = new s3.Bucket(this, "TranscodedVideosBucket", {
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

    this.transcodingStatusTable = new dynamodb.Table(this, "TrancodingStatus", {
      partitionKey: { name: "MovieId", type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.movieRatingsTable.addGlobalSecondaryIndex({
      indexName: "UserIdIndex",
      partitionKey: { name: "UserId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "MovieId", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
      readCapacity: 1,
      writeCapacity: 1,
    });

    this.transcodingQueue = new sqs.Queue(this, "transcodingQueue", {
      visibilityTimeout: cdk.Duration.hours(1),
    });

    this.moviesBucket.addEventNotification(s3.EventType.OBJECT_CREATED_PUT, new s3n.SqsDestination(this.transcodingQueue));

    this.downloadsDataTable = new dynamodb.Table(this, "DownloadsData", {
      partitionKey: { name: "UserId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "MovieId", type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.downloadsDataTable.addGlobalSecondaryIndex({
      indexName: "MovieId-index",
      partitionKey: { name: "MovieId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "UserId", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
      readCapacity: 1,
      writeCapacity: 1,
    });

    this.feedsDataTable = new dynamodb.Table(this, 'FeedsData', {
      partitionKey: { name: 'UserId', type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
