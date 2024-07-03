"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiGwStack = void 0;
const cdk = require("aws-cdk-lib");
const apigateway = require("aws-cdk-lib/aws-apigateway");
class ApiGwStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const { uploadMovieFn, downloadMovieFn, getSingleMovieFn, getMoviesFn, deleteMovieFn, subscribeFn, getSubscriptionsFn, unsubscribeFn, editMovieFn, rateMovieFn } = props;
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
exports.ApiGwStack = ApiGwStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLWd3LXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBpLWd3LXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUVuQyx5REFBeUQ7QUFnQnpELE1BQWEsVUFBVyxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ3ZDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBdUI7UUFDL0QsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsTUFBTSxFQUFFLGFBQWEsRUFBRSxlQUFlLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUsa0JBQWtCLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsR0FBRyxLQUFNLENBQUM7UUFFMUssTUFBTSw0QkFBNEIsR0FBRyxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNyRixNQUFNLDhCQUE4QixHQUFHLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ3pGLE1BQU0sK0JBQStCLEdBQUcsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUMzRixNQUFNLDBCQUEwQixHQUFHLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ2pGLE1BQU0sNEJBQTRCLEdBQUcsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDckYsTUFBTSwwQkFBMEIsR0FBRyxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNqRixNQUFNLGlDQUFpQyxHQUFHLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDL0YsTUFBTSw0QkFBNEIsR0FBRyxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIs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Q3RDLFVBQVUsRUFBRTtvQkFDVixPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUU7b0JBQ25ELE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRTtpQkFDbkQ7Z0JBQ0QsUUFBUSxFQUFFLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQzthQUNoQztTQUNGLENBQUMsQ0FBQztRQUVILE1BQU0saUJBQWlCLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDN0QsaUJBQWlCLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSwwQkFBMEIsRUFBRTtZQUM5RCxhQUFhLEVBQUU7Z0JBQ2Isa0JBQWtCLEVBQUUsMEJBQTBCO2FBQy9DO1lBQ0QsdUJBQXVCLEVBQUU7Z0JBQ3ZCLG1CQUFtQixFQUFFLElBQUk7YUFDMUI7U0FDRixDQUFDLENBQUM7UUFDSCxpQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQztZQUNqQyxZQUFZLEVBQUUsQ0FBQyxHQUFHLENBQUM7U0FDcEIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBMUtELGdDQTBLQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tIFwiYXdzLWNkay1saWJcIjtcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcclxuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXlcIjtcclxuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtbGFtYmRhXCI7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEFwaUd3U3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcclxuICB1cGxvYWRNb3ZpZUZuOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgZG93bmxvYWRNb3ZpZUZuOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgZ2V0U2luZ2xlTW92aWVGbjogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gIGdldE1vdmllc0ZuOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgZGVsZXRlTW92aWVGbjogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gIHN1YnNjcmliZUZuOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgZ2V0U3Vic2NyaXB0aW9uc0ZuOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgdW5zdWJzY3JpYmVGbjogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gIGVkaXRNb3ZpZUZuOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgcmF0ZU1vdmllRm46IGxhbWJkYS5GdW5jdGlvbjtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEFwaUd3U3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xyXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogQXBpR3dTdGFja1Byb3BzKSB7XHJcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcclxuXHJcbiAgICBjb25zdCB7IHVwbG9hZE1vdmllRm4sIGRvd25sb2FkTW92aWVGbiwgZ2V0U2luZ2xlTW92aWVGbiwgZ2V0TW92aWVzRm4sIGRlbGV0ZU1vdmllRm4sIHN1YnNjcmliZUZuLCBnZXRTdWJzY3JpcHRpb25zRm4sIHVuc3Vic2NyaWJlRm4sIGVkaXRNb3ZpZUZuLCByYXRlTW92aWVGbiB9ID0gcHJvcHMhO1xyXG5cclxuICAgIGNvbnN0IHVwbG9hZE1vdmllTGFtYmRhSW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih1cGxvYWRNb3ZpZUZuKTtcclxuICAgIGNvbnN0IGRvd25sb2FkTW92aWVMYW1iZGFJbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGRvd25sb2FkTW92aWVGbik7XHJcbiAgICBjb25zdCBnZXRTaW5nbGVNb3ZpZUxhbWJkYUludGVncmF0aW9uID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZ2V0U2luZ2xlTW92aWVGbik7XHJcbiAgICBjb25zdCBnZXRNb3ZpZXNMYW1iZGFJbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGdldE1vdmllc0ZuKTtcclxuICAgIGNvbnN0IGRlbGV0ZU1vdmllTGFtYmRhSW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihkZWxldGVNb3ZpZUZuKTtcclxuICAgIGNvbnN0IHN1YnNjcmliZUxhbWJkYUludGVncmF0aW9uID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oc3Vic2NyaWJlRm4pO1xyXG4gICAgY29uc3QgZ2V0U3Vic2NyaXB0aW9uc0xhbWJkYUludGVncmF0aW9uID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZ2V0U3Vic2NyaXB0aW9uc0ZuKTtcclxuICAgIGNvbnN0IHVuc3Vic2NyaWJlTGFtYmRhSW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih1bnN1YnNjcmliZUZuKTtcclxuICAgIGNvbnN0IGVkaXRNb3ZpZUxhbWJkYUludGVncmF0aW9uID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZWRpdE1vdmllRm4pO1xyXG4gICAgY29uc3QgcmF0ZU1vdmllTGFtYmRhSW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihyYXRlTW92aWVGbik7XHJcblxyXG4gICAgY29uc3QgYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCBcIk1vdmllc0FwaVwiLCB7XHJcbiAgICAgIHJlc3RBcGlOYW1lOiBcIk1vdmllcyBTZXJ2aWNlXCIsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlRoaXMgc2VydmljZSBzZXJ2ZXMgbW92aWVzLlwiLFxyXG4gICAgICBjbG91ZFdhdGNoUm9sZTogdHJ1ZSxcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGRvd25sb2FkTW92aWVSZXNvdXJjZSA9IGFwaS5yb290LmFkZFJlc291cmNlKFwiZG93bmxvYWQtbW92aWVcIik7XHJcbiAgICBkb3dubG9hZE1vdmllUmVzb3VyY2UuYWRkTWV0aG9kKFwiR0VUXCIsIGRvd25sb2FkTW92aWVMYW1iZGFJbnRlZ3JhdGlvbiwge1xyXG4gICAgICByZXF1ZXN0UGFyYW1ldGVyczoge1xyXG4gICAgICAgIFwibWV0aG9kLnJlcXVlc3QucXVlcnlzdHJpbmcubW92aWVJZFwiOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgICByZXF1ZXN0VmFsaWRhdG9yT3B0aW9uczoge1xyXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdFBhcmFtZXRlcnM6IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCB1cGxvYWRNb3ZpZVJlcXVlc3RCb2R5U2NoZW1hID0gbmV3IGFwaWdhdGV3YXkuTW9kZWwodGhpcywgXCJ1cGxvYWRNb3ZpZVJlcXVlc3RCb2R5U2NoZW1hXCIsIHtcclxuICAgICAgcmVzdEFwaTogYXBpLFxyXG4gICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uXCIsXHJcbiAgICAgIHNjaGVtYToge1xyXG4gICAgICAgIHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuT0JKRUNULFxyXG4gICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgIHRpdGxlOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgZ2VucmVzOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuQVJSQVkgfSxcclxuICAgICAgICAgIGFjdG9yczogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLkFSUkFZIH0sXHJcbiAgICAgICAgICBkaXJlY3RvcnM6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5BUlJBWSB9LFxyXG4gICAgICAgICAgY292ZXJGaWxlTmFtZTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgY292ZXJGaWxlVHlwZTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgdmlkZW9GaWxlTmFtZTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgdmlkZW9GaWxlVHlwZTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVxdWlyZWQ6IFtcInRpdGxlXCIsIFwiZGVzY3JpcHRpb25cIiwgXCJnZW5yZXNcIiwgXCJhY3RvcnNcIiwgXCJkaXJlY3RvcnNcIiwgXCJjb3ZlckZpbGVOYW1lXCIsIFwiY292ZXJGaWxlVHlwZVwiLCBcInZpZGVvRmlsZU5hbWVcIiwgXCJ2aWRlb0ZpbGVUeXBlXCJdLFxyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgbW92aWVzUmVzb3VyY2UgPSBhcGkucm9vdC5hZGRSZXNvdXJjZShcIm1vdmllc1wiKTtcclxuICAgIG1vdmllc1Jlc291cmNlLmFkZE1ldGhvZChcIkdFVFwiLCBnZXRNb3ZpZXNMYW1iZGFJbnRlZ3JhdGlvbiwge1xyXG4gICAgICByZXF1ZXN0UGFyYW1ldGVyczoge1xyXG4gICAgICAgIFwibWV0aG9kLnJlcXVlc3QucGF0aC50aXRsZVwiOiBmYWxzZSxcclxuICAgICAgICBcIm1ldGhvZC5yZXF1ZXN0LnBhdGguZGVzY3JpcHRpb25cIjogZmFsc2UsXHJcbiAgICAgICAgXCJtZXRob2QucmVxdWVzdC5wYXRoLmFjdG9yXCI6IGZhbHNlLFxyXG4gICAgICAgIFwibWV0aG9kLnJlcXVlc3QucGF0aC5kaXJlY3RvclwiOiBmYWxzZSxcclxuICAgICAgICBcIm1ldGhvZC5yZXF1ZXN0LnBhdGguZ2VucmVcIjogZmFsc2UsXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlcXVlc3RWYWxpZGF0b3JPcHRpb25zOiB7XHJcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0UGFyYW1ldGVyczogdHJ1ZSxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG4gICAgbW92aWVzUmVzb3VyY2UuYWRkTWV0aG9kKFwiUE9TVFwiLCB1cGxvYWRNb3ZpZUxhbWJkYUludGVncmF0aW9uLCB7XHJcbiAgICAgIHJlcXVlc3RNb2RlbHM6IHtcclxuICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjogdXBsb2FkTW92aWVSZXF1ZXN0Qm9keVNjaGVtYSxcclxuICAgICAgfSxcclxuICAgICAgcmVxdWVzdFZhbGlkYXRvck9wdGlvbnM6IHtcclxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RCb2R5OiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcbiAgICBtb3ZpZXNSZXNvdXJjZS5hZGRDb3JzUHJlZmxpZ2h0KHtcclxuICAgICAgYWxsb3dPcmlnaW5zOiBbXCIqXCJdLFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgbW92aWVSZXNvdXJjZSA9IG1vdmllc1Jlc291cmNlLmFkZFJlc291cmNlKFwie2lkfVwiKTtcclxuICAgIG1vdmllUmVzb3VyY2UuYWRkTWV0aG9kKFwiR0VUXCIsIGdldFNpbmdsZU1vdmllTGFtYmRhSW50ZWdyYXRpb24sIHtcclxuICAgICAgcmVxdWVzdFBhcmFtZXRlcnM6IHtcclxuICAgICAgICBcIm1ldGhvZC5yZXF1ZXN0LnBhdGguaWRcIjogdHJ1ZSxcclxuICAgICAgfSxcclxuICAgICAgcmVxdWVzdFZhbGlkYXRvck9wdGlvbnM6IHtcclxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RQYXJhbWV0ZXJzOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcbiAgICBtb3ZpZVJlc291cmNlLmFkZE1ldGhvZChcIkRFTEVURVwiLCBkZWxldGVNb3ZpZUxhbWJkYUludGVncmF0aW9uLCB7XHJcbiAgICAgIHJlcXVlc3RQYXJhbWV0ZXJzOiB7XHJcbiAgICAgICAgXCJtZXRob2QucmVxdWVzdC5wYXRoLmlkXCI6IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlcXVlc3RWYWxpZGF0b3JPcHRpb25zOiB7XHJcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0UGFyYW1ldGVyczogdHJ1ZSxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG4gICAgbW92aWVSZXNvdXJjZS5hZGRNZXRob2QoXCJQVVRcIiwgZWRpdE1vdmllTGFtYmRhSW50ZWdyYXRpb24sIHtcclxuICAgICAgcmVxdWVzdE1vZGVsczoge1xyXG4gICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB1cGxvYWRNb3ZpZVJlcXVlc3RCb2R5U2NoZW1hLFxyXG4gICAgICB9LFxyXG4gICAgICByZXF1ZXN0VmFsaWRhdG9yT3B0aW9uczoge1xyXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdEJvZHk6IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlcXVlc3RQYXJhbWV0ZXJzOiB7XHJcbiAgICAgICAgXCJtZXRob2QucmVxdWVzdC5wYXRoLmlkXCI6IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuICAgIG1vdmllUmVzb3VyY2UuYWRkQ29yc1ByZWZsaWdodCh7XHJcbiAgICAgIGFsbG93T3JpZ2luczogW1wiKlwiXSxcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IHN1YnNjcmliZVJlcXVlc3RCb2R5U2NoZW1hID0gbmV3IGFwaWdhdGV3YXkuTW9kZWwodGhpcywgXCJzdWJzY3JpYmVSZXF1ZXN0Qm9keVNjaGVtYVwiLCB7XHJcbiAgICAgIHJlc3RBcGk6IGFwaSxcclxuICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvblwiLFxyXG4gICAgICBzY2hlbWE6IHtcclxuICAgICAgICB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLk9CSkVDVCxcclxuICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICBzdWJzY3JpYmVkVG86IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlcXVpcmVkOiBbXCJzdWJzY3JpYmVkVG9cIl0sXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBzdWJzY3JpcHRpb25zUmVzb3VyY2UgPSBhcGkucm9vdC5hZGRSZXNvdXJjZShcInN1YnNjcmlwdGlvbnNcIik7XHJcbiAgICBzdWJzY3JpcHRpb25zUmVzb3VyY2UuYWRkTWV0aG9kKFwiUE9TVFwiLCBzdWJzY3JpYmVMYW1iZGFJbnRlZ3JhdGlvbiwge1xyXG4gICAgICByZXF1ZXN0TW9kZWxzOiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHN1YnNjcmliZVJlcXVlc3RCb2R5U2NoZW1hLFxyXG4gICAgICB9LFxyXG4gICAgICByZXF1ZXN0VmFsaWRhdG9yT3B0aW9uczoge1xyXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdEJvZHk6IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuICAgIHN1YnNjcmlwdGlvbnNSZXNvdXJjZS5hZGRDb3JzUHJlZmxpZ2h0KHtcclxuICAgICAgYWxsb3dPcmlnaW5zOiBbXCIqXCJdLFxyXG4gICAgfSk7XHJcbiAgICBzdWJzY3JpcHRpb25zUmVzb3VyY2UuYWRkTWV0aG9kKFwiR0VUXCIsIGdldFN1YnNjcmlwdGlvbnNMYW1iZGFJbnRlZ3JhdGlvbik7XHJcbiAgICBzdWJzY3JpcHRpb25zUmVzb3VyY2UuYWRkTWV0aG9kKFwiREVMRVRFXCIsIHVuc3Vic2NyaWJlTGFtYmRhSW50ZWdyYXRpb24sIHtcclxuICAgICAgcmVxdWVzdFBhcmFtZXRlcnM6IHtcclxuICAgICAgICBcIm1ldGhvZC5yZXF1ZXN0LnF1ZXJ5c3RyaW5nLnN1YnNjcmliZWRUb1wiOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgICByZXF1ZXN0VmFsaWRhdG9yT3B0aW9uczoge1xyXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdFBhcmFtZXRlcnM6IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCByYXRlTW92aWVSZXF1ZXN0Qm9keVNjaGVtYSA9IG5ldyBhcGlnYXRld2F5Lk1vZGVsKHRoaXMsIFwicmF0ZU1vdmllUmVxdWVzdEJvZHlTY2hlbWFcIiwge1xyXG4gICAgICByZXN0QXBpOiBhcGksXHJcbiAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb25cIixcclxuICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5PQkpFQ1QsXHJcbiAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgbW92aWVJZDogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgcmF0aW5nOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICByZXF1aXJlZDogW1wibW92aWVJZFwiLCBcInJhdGluZ1wiXSxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IHJhdGVNb3ZpZVJlc291cmNlID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoXCJyYXRlLW1vdmllXCIpO1xyXG4gICAgcmF0ZU1vdmllUmVzb3VyY2UuYWRkTWV0aG9kKFwiUE9TVFwiLCByYXRlTW92aWVMYW1iZGFJbnRlZ3JhdGlvbiwge1xyXG4gICAgICByZXF1ZXN0TW9kZWxzOiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHJhdGVNb3ZpZVJlcXVlc3RCb2R5U2NoZW1hLFxyXG4gICAgICB9LFxyXG4gICAgICByZXF1ZXN0VmFsaWRhdG9yT3B0aW9uczoge1xyXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdEJvZHk6IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuICAgIHJhdGVNb3ZpZVJlc291cmNlLmFkZENvcnNQcmVmbGlnaHQoe1xyXG4gICAgICBhbGxvd09yaWdpbnM6IFtcIipcIl0sXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIl19