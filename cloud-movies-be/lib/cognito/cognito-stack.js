"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CognitoStack = void 0;
const cdk = require("aws-cdk-lib");
const cognito = require("aws-cdk-lib/aws-cognito");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const lambda = require("aws-cdk-lib/aws-lambda");
const path = require("path");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const s3 = require("aws-cdk-lib/aws-s3");
const apigateway = require("@aws-cdk/aws-apigateway");
class CognitoStack extends cdk.Stack {
    constructor(scope, id, props) {
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
        addToDefaultUserGroupFn.addToRolePolicy(new aws_iam_1.PolicyStatement({
            effect: aws_iam_1.Effect.ALLOW,
            actions: ["cognito-identity:*", "cognito-sync:*", "cognito-idp:*"],
            resources: ["*"],
        }));
        userPool.addTrigger(cognito.UserPoolOperation.POST_CONFIRMATION, addToDefaultUserGroupFn);
        const moviesDataTable = new dynamodb.Table(this, "MoviesData", {
            partitionKey: { name: "movieId", type: dynamodb.AttributeType.STRING },
            readCapacity: 1,
            writeCapacity: 1,
        });
        const moviesBucket = new s3.Bucket(this, "MoviesBucket", {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
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
        uploadMovieFn.addToRolePolicy(new aws_iam_1.PolicyStatement({
            effect: aws_iam_1.Effect.ALLOW,
            actions: ["s3:*", "dynamodb:*"],
            resources: [moviesBucket.bucketArn, moviesDataTable.tableArn],
        }));
        downloadMovieFn.addToRolePolicy(new aws_iam_1.PolicyStatement({
            effect: aws_iam_1.Effect.ALLOW,
            actions: ["s3:*", "dynamodb:*"],
            resources: [moviesBucket.bucketArn, moviesDataTable.tableArn],
        }));
        getMoviesFn.addToRolePolicy(new aws_iam_1.PolicyStatement({
            effect: aws_iam_1.Effect.ALLOW,
            actions: ["dynamodb:Scan"],
            resources: [moviesDataTable.tableArn],
        }));
        const api = new apigateway.RestApi(this, "MoviesApi", {
            restApiName: "Movies Service",
            description: "This service handles movie uploads, downloads, and data management.",
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
            },
        });
        const uploadMovieIntegration = new apigateway.LambdaIntegration(uploadMovieFn);
        const downloadMovieIntegration = new apigateway.LambdaIntegration(downloadMovieFn);
        const getMoviesIntegration = new apigateway.LambdaIntegration(getMoviesFn);
        const uploadMovieResource = api.root.addResource("upload-movie");
        uploadMovieResource.addMethod("POST", uploadMovieIntegration);
        const downloadMovieResource = api.root.addResource("download-movie");
        downloadMovieResource.addMethod("GET", downloadMovieIntegration);
        const getMoviesResource = api.root.addResource("movies");
        getMoviesResource.addMethod("GET", getMoviesIntegration);
    }
}
exports.CognitoStack = CognitoStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29nbml0by1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvZ25pdG8tc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQW1DO0FBQ25DLG1EQUFtRDtBQUNuRCxpREFBOEQ7QUFDOUQsaURBQWlEO0FBRWpELDZCQUE4QjtBQUM5QixxREFBcUQ7QUFDckQseUNBQXlDO0FBQ3pDLHNEQUFzRDtBQUV0RCxNQUFhLFlBQWEsU0FBUSxHQUFHLENBQUMsS0FBSztJQUN6QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sUUFBUSxHQUFHLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQzNELGFBQWEsRUFBRTtnQkFDYixRQUFRLEVBQUUsSUFBSTthQUNmO1lBQ0QsZUFBZSxFQUFFLE9BQU8sQ0FBQyxlQUFlLENBQUMsVUFBVTtZQUNuRCxpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLFVBQVUsRUFBRTtnQkFDVixLQUFLLEVBQUUsSUFBSTthQUNaO1lBQ0QsZ0JBQWdCLEVBQUU7Z0JBQ2hCLFVBQVUsRUFBRSxPQUFPLENBQUMsc0JBQXNCLENBQUMsSUFBSTthQUNoRDtZQUNELFlBQVksRUFBRTtnQkFDWixLQUFLLEVBQUUsSUFBSTthQUNaO1lBQ0Qsa0JBQWtCLEVBQUU7Z0JBQ2xCLFNBQVMsRUFBRTtvQkFDVCxRQUFRLEVBQUUsSUFBSTtpQkFDZjtnQkFDRCxVQUFVLEVBQUU7b0JBQ1YsUUFBUSxFQUFFLElBQUk7aUJBQ2Y7Z0JBQ0QsU0FBUyxFQUFFO29CQUNULFFBQVEsRUFBRSxJQUFJO2lCQUNmO2dCQUNELEtBQUssRUFBRTtvQkFDTCxRQUFRLEVBQUUsSUFBSTtpQkFDZjthQUNGO1lBQ0QsS0FBSyxFQUFFLE9BQU8sQ0FBQyxhQUFhLENBQUMsV0FBVyxFQUFF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LEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDckUscUJBQXFCLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO1FBRWpFLE1BQU0saUJBQWlCLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDekQsaUJBQWlCLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO0lBQzNELENBQUM7Q0FDRjtBQXBLRCxvQ0FvS0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSBcImF3cy1jZGstbGliXCI7XHJcbmltcG9ydCAqIGFzIGNvZ25pdG8gZnJvbSBcImF3cy1jZGstbGliL2F3cy1jb2duaXRvXCI7XHJcbmltcG9ydCB7IEVmZmVjdCwgUG9saWN5U3RhdGVtZW50IH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1pYW1cIjtcclxuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtbGFtYmRhXCI7XHJcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gXCJjb25zdHJ1Y3RzXCI7XHJcbmltcG9ydCBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XHJcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGJcIjtcclxuaW1wb3J0ICogYXMgczMgZnJvbSBcImF3cy1jZGstbGliL2F3cy1zM1wiO1xyXG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ0Bhd3MtY2RrL2F3cy1hcGlnYXRld2F5JztcclxuXHJcbmV4cG9ydCBjbGFzcyBDb2duaXRvU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xyXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcclxuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xyXG5cclxuICAgIGNvbnN0IHVzZXJQb29sID0gbmV3IGNvZ25pdG8uVXNlclBvb2wodGhpcywgXCJtb3ZpZVVzZXJQb29sXCIsIHtcclxuICAgICAgc2lnbkluQWxpYXNlczoge1xyXG4gICAgICAgIHVzZXJuYW1lOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgICBhY2NvdW50UmVjb3Zlcnk6IGNvZ25pdG8uQWNjb3VudFJlY292ZXJ5LkVNQUlMX09OTFksXHJcbiAgICAgIHNlbGZTaWduVXBFbmFibGVkOiB0cnVlLFxyXG4gICAgICBhdXRvVmVyaWZ5OiB7XHJcbiAgICAgICAgZW1haWw6IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICAgIHVzZXJWZXJpZmljYXRpb246IHtcclxuICAgICAgICBlbWFpbFN0eWxlOiBjb2duaXRvLlZlcmlmaWNhdGlvbkVtYWlsU3R5bGUuTElOSyxcclxuICAgICAgfSxcclxuICAgICAga2VlcE9yaWdpbmFsOiB7XHJcbiAgICAgICAgZW1haWw6IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICAgIHN0YW5kYXJkQXR0cmlidXRlczoge1xyXG4gICAgICAgIGdpdmVuTmFtZToge1xyXG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBmYW1pbHlOYW1lOiB7XHJcbiAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGJpcnRoZGF0ZToge1xyXG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbWFpbDoge1xyXG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgZW1haWw6IGNvZ25pdG8uVXNlclBvb2xFbWFpbC53aXRoQ29nbml0bygpLFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgdXNlclBvb2xDbGllbnQgPSB1c2VyUG9vbC5hZGRDbGllbnQoXCJicmllZkNpbmVtYUZlXCIsIHtcclxuICAgICAgcHJldmVudFVzZXJFeGlzdGVuY2VFcnJvcnM6IHRydWUsXHJcbiAgICB9KTtcclxuXHJcbiAgICB1c2VyUG9vbC5hZGREb21haW4oXCJicmllZkNpbmVtYUNvZ25pdG9Eb21haW5cIiwge1xyXG4gICAgICBjb2duaXRvRG9tYWluOiB7XHJcbiAgICAgICAgZG9tYWluUHJlZml4OiBcImJyaWVmY2luZW1hdXNlcnN0ZW9cIixcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IHJlZ3VsYXJVc2VyR3JvdXAgPSBuZXcgY29nbml0by5DZm5Vc2VyUG9vbEdyb3VwKHRoaXMsIFwicmVndWxhclVzZXJHcm91cFwiLCB7XHJcbiAgICAgIHVzZXJQb29sSWQ6IHVzZXJQb29sLnVzZXJQb29sSWQsXHJcbiAgICAgIGdyb3VwTmFtZTogXCJSZWd1bGFyVXNlcnNcIixcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGFkbWluVXNlckdyb3VwID0gbmV3IGNvZ25pdG8uQ2ZuVXNlclBvb2xHcm91cCh0aGlzLCBcImFkbWluVXNlckdyb3VwXCIsIHtcclxuICAgICAgdXNlclBvb2xJZDogdXNlclBvb2wudXNlclBvb2xJZCxcclxuICAgICAgZ3JvdXBOYW1lOiBcIkFkbWluc1wiLFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgYWRkVG9EZWZhdWx0VXNlckdyb3VwRm4gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsIFwiYWRkVG9EZWZhdWx0VXNlckdyb3VwRm5cIiwge1xyXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcclxuICAgICAgaGFuZGxlcjogXCJpbmRleC5hZGRUb1VzZXJHcm91cFwiLFxyXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgXCIuL3NyY1wiKSksXHJcbiAgICB9KTtcclxuXHJcbiAgICBhZGRUb0RlZmF1bHRVc2VyR3JvdXBGbi5hZGRUb1JvbGVQb2xpY3koXHJcbiAgICAgIG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xyXG4gICAgICAgIGVmZmVjdDogRWZmZWN0LkFMTE9XLFxyXG4gICAgICAgIGFjdGlvbnM6IFtcImNvZ25pdG8taWRlbnRpdHk6KlwiLCBcImNvZ25pdG8tc3luYzoqXCIsIFwiY29nbml0by1pZHA6KlwiXSxcclxuICAgICAgICByZXNvdXJjZXM6IFtcIipcIl0sXHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG5cclxuICAgIHVzZXJQb29sLmFkZFRyaWdnZXIoY29nbml0by5Vc2VyUG9vbE9wZXJhdGlvbi5QT1NUX0NPTkZJUk1BVElPTiwgYWRkVG9EZWZhdWx0VXNlckdyb3VwRm4pO1xyXG5cclxuICAgIGNvbnN0IG1vdmllc0RhdGFUYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCBcIk1vdmllc0RhdGFcIiwge1xyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogXCJtb3ZpZUlkXCIsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHJlYWRDYXBhY2l0eTogMSxcclxuICAgICAgd3JpdGVDYXBhY2l0eTogMSxcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IG1vdmllc0J1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgXCJNb3ZpZXNCdWNrZXRcIiwge1xyXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxyXG4gICAgICBhdXRvRGVsZXRlT2JqZWN0czogdHJ1ZSxcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IHVwbG9hZE1vdmllRm4gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsIFwidXBsb2FkTW92aWVGblwiLCB7XHJcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxyXG4gICAgICBoYW5kbGVyOiBcInVwbG9hZC1tb3ZpZS5oYW5kbGVyXCIsXHJcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCBcIi4vc3JjXCIpKSxcclxuICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICBTM19CVUNLRVQ6IG1vdmllc0J1Y2tldC5idWNrZXROYW1lLFxyXG4gICAgICAgIERZTkFNT0RCX1RBQkxFOiBtb3ZpZXNEYXRhVGFibGUudGFibGVOYW1lLFxyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgZG93bmxvYWRNb3ZpZUZuID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCBcImRvd25sb2FkTW92aWVGblwiLCB7XHJcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxyXG4gICAgICBoYW5kbGVyOiBcImRvd25sb2FkLW1vdmllLmhhbmRsZXJcIixcclxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsIFwiLi9zcmNcIikpLFxyXG4gICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgIFMzX0JVQ0tFVDogbW92aWVzQnVja2V0LmJ1Y2tldE5hbWUsXHJcbiAgICAgICAgRFlOQU1PREJfVEFCTEU6IG1vdmllc0RhdGFUYWJsZS50YWJsZU5hbWUsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBnZXRNb3ZpZXNGbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgXCJnZXRNb3ZpZXNGblwiLCB7XHJcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxyXG4gICAgICBoYW5kbGVyOiBcImdldC1tb3ZpZXMuaGFuZGxlclwiLFxyXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgXCIuL3NyY1wiKSksXHJcbiAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgRFlOQU1PREJfVEFCTEU6IG1vdmllc0RhdGFUYWJsZS50YWJsZU5hbWUsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICBtb3ZpZXNCdWNrZXQuZ3JhbnRSZWFkV3JpdGUodXBsb2FkTW92aWVGbik7XHJcbiAgICBtb3ZpZXNCdWNrZXQuZ3JhbnRSZWFkV3JpdGUoZG93bmxvYWRNb3ZpZUZuKTtcclxuICAgIG1vdmllc0RhdGFUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEodXBsb2FkTW92aWVGbik7XHJcbiAgICBtb3ZpZXNEYXRhVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGRvd25sb2FkTW92aWVGbik7XHJcbiAgICBtb3ZpZXNEYXRhVGFibGUuZ3JhbnRSZWFkRGF0YShnZXRNb3ZpZXNGbik7XHJcblxyXG4gICAgdXBsb2FkTW92aWVGbi5hZGRUb1JvbGVQb2xpY3koXHJcbiAgICAgICAgbmV3IFBvbGljeVN0YXRlbWVudCh7XHJcbiAgICAgICAgICBlZmZlY3Q6IEVmZmVjdC5BTExPVyxcclxuICAgICAgICAgIGFjdGlvbnM6IFtcInMzOipcIiwgXCJkeW5hbW9kYjoqXCJdLFxyXG4gICAgICAgICAgcmVzb3VyY2VzOiBbbW92aWVzQnVja2V0LmJ1Y2tldEFybiwgbW92aWVzRGF0YVRhYmxlLnRhYmxlQXJuXSxcclxuICAgICAgICB9KVxyXG4gICAgKTtcclxuXHJcbiAgICBkb3dubG9hZE1vdmllRm4uYWRkVG9Sb2xlUG9saWN5KFxyXG4gICAgICAgIG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xyXG4gICAgICAgICAgZWZmZWN0OiBFZmZlY3QuQUxMT1csXHJcbiAgICAgICAgICBhY3Rpb25zOiBbXCJzMzoqXCIsIFwiZHluYW1vZGI6KlwiXSxcclxuICAgICAgICAgIHJlc291cmNlczogW21vdmllc0J1Y2tldC5idWNrZXRBcm4sIG1vdmllc0RhdGFUYWJsZS50YWJsZUFybl0sXHJcbiAgICAgICAgfSlcclxuICAgICk7XHJcblxyXG4gICAgZ2V0TW92aWVzRm4uYWRkVG9Sb2xlUG9saWN5KFxyXG4gICAgICAgIG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xyXG4gICAgICAgICAgZWZmZWN0OiBFZmZlY3QuQUxMT1csXHJcbiAgICAgICAgICBhY3Rpb25zOiBbXCJkeW5hbW9kYjpTY2FuXCJdLFxyXG4gICAgICAgICAgcmVzb3VyY2VzOiBbbW92aWVzRGF0YVRhYmxlLnRhYmxlQXJuXSxcclxuICAgICAgICB9KVxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBhcGkgPSBuZXcgYXBpZ2F0ZXdheS5SZXN0QXBpKHRoaXMsIFwiTW92aWVzQXBpXCIsIHtcclxuICAgICAgcmVzdEFwaU5hbWU6IFwiTW92aWVzIFNlcnZpY2VcIixcclxuICAgICAgZGVzY3JpcHRpb246IFwiVGhpcyBzZXJ2aWNlIGhhbmRsZXMgbW92aWUgdXBsb2FkcywgZG93bmxvYWRzLCBhbmQgZGF0YSBtYW5hZ2VtZW50LlwiLFxyXG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHtcclxuICAgICAgICBhbGxvd09yaWdpbnM6IGFwaWdhdGV3YXkuQ29ycy5BTExfT1JJR0lOUyxcclxuICAgICAgICBhbGxvd01ldGhvZHM6IGFwaWdhdGV3YXkuQ29ycy5BTExfTUVUSE9EUyxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IHVwbG9hZE1vdmllSW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih1cGxvYWRNb3ZpZUZuKTtcclxuICAgIGNvbnN0IGRvd25sb2FkTW92aWVJbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGRvd25sb2FkTW92aWVGbik7XHJcbiAgICBjb25zdCBnZXRNb3ZpZXNJbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGdldE1vdmllc0ZuKTtcclxuXHJcbiAgICBjb25zdCB1cGxvYWRNb3ZpZVJlc291cmNlID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoXCJ1cGxvYWQtbW92aWVcIik7XHJcbiAgICB1cGxvYWRNb3ZpZVJlc291cmNlLmFkZE1ldGhvZChcIlBPU1RcIiwgdXBsb2FkTW92aWVJbnRlZ3JhdGlvbik7XHJcblxyXG4gICAgY29uc3QgZG93bmxvYWRNb3ZpZVJlc291cmNlID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoXCJkb3dubG9hZC1tb3ZpZVwiKTtcclxuICAgIGRvd25sb2FkTW92aWVSZXNvdXJjZS5hZGRNZXRob2QoXCJHRVRcIiwgZG93bmxvYWRNb3ZpZUludGVncmF0aW9uKTtcclxuXHJcbiAgICBjb25zdCBnZXRNb3ZpZXNSZXNvdXJjZSA9IGFwaS5yb290LmFkZFJlc291cmNlKFwibW92aWVzXCIpO1xyXG4gICAgZ2V0TW92aWVzUmVzb3VyY2UuYWRkTWV0aG9kKFwiR0VUXCIsIGdldE1vdmllc0ludGVncmF0aW9uKTtcclxuICB9XHJcbn1cclxuIl19