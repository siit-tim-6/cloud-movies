import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class DataStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const moviesDataTable = new dynamodb.Table(this, "MoviesData", {
      partitionKey: { name: "MovieId", type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    moviesDataTable.addGlobalSecondaryIndex({
      indexName: "titleSearch",
      partitionKey: { name: "LowerTitle", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "LowerDescription", type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1,
    });

    moviesDataTable.addGlobalSecondaryIndex({
      indexName: "descriptionSearch",
      partitionKey: { name: "LowerDescription", type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1,
    });

    const subscriptionsDataTable = new dynamodb.Table(this, "SubscriptionsData", {
      partitionKey: { name: "UserId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SubscribedTo", type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    subscriptionsDataTable.addGlobalSecondaryIndex({
      indexName: "SubscribedToSearch",
      partitionKey: { name: "SubscribedTo", type: dynamodb.AttributeType.STRING },
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

    new cdk.CfnOutput(this, "moviesDataTableArn", {
      exportName: "moviesDataTableArn",
      value: moviesDataTable.tableArn,
    });

    new cdk.CfnOutput(this, "subscriptionsDataTableArn", {
      exportName: "subscriptionsDataTableArn",
      value: subscriptionsDataTable.tableArn,
    });

    new cdk.CfnOutput(this, "moviesBucketArn", {
      exportName: "moviesBucketArn",
      value: moviesBucket.bucketArn,
    });
  }
}
