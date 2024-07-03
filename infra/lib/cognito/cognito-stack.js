"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CognitoStack = void 0;
const cdk = require("aws-cdk-lib");
const cognito = require("aws-cdk-lib/aws-cognito");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const lambda = require("aws-cdk-lib/aws-lambda");
const path = require("path");
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
                domainPrefix: "briefcinemausersbalsa",
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
    }
}
exports.CognitoStack = CognitoStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29nbml0by1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvZ25pdG8tc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQW1DO0FBQ25DLG1EQUFtRDtBQUNuRCxpREFBOEQ7QUFDOUQsaURBQWlEO0FBRWpELDZCQUE4QjtBQUU5QixNQUFhLFlBQWEsU0FBUSxHQUFHLENBQUMsS0FBSztJQUN6QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sUUFBUSxHQUFHLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQzNELGFBQWEsRUFBRTtnQkFDYixRQUFRLEVBQUUsSUFBSTthQUNmO1lBQ0QsZUFBZSxFQUFFLE9BQU8sQ0FBQyxlQUFlLENBQUMsVUFBVTtZQUNuRCxpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLFVBQVUsRUFBRTtnQkFDVixLQUFLLEVBQUUsSUFBSTthQUNaO1lBQ0QsZ0JBQWdCLEVBQUU7Z0JBQ2hCLFVBQVUsRUFBRSxPQUFPLENBQUMsc0JBQXNCLENBQUMsSUFBSTthQUNoRDtZQUNELFlBQVksRUFBRTtnQkFDWixLQUFLLEVBQUUsSUFBSTthQUNaO1lBQ0Qsa0JBQWtCLEVBQUU7Z0JBQ2xCLFNBQVMsRUFBRTtvQkFDVCxRQUFRLEVBQUUsSUFBSTtpQkFDZjtnQkFDRCxVQUFVLEVBQUU7b0JBQ1YsUUFBUSxFQUFFLElBQUk7aUJBQ2Y7Z0JBQ0QsU0FBUyxFQUFFO29CQUNULFFBQVEsRUFBRSxJQUFJO2lCQUNmO2dCQUNELEtBQUssRUFBRTtvQkFDTCxRQUFRLEVBQUUsSUFBSTtpQkFDZjthQUNGO1lBQ0QsS0FBSyxFQUFFLE9BQU8sQ0FBQyxhQUFhLENBQUMsV0FBVyxFQUFFO1NBQzNDLENBQUMsQ0FBQztRQUVILE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsZUFBZSxFQUFFO1lBQ3pELDBCQUEwQixFQUFFLElBQUk7U0FDakMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLFNBQVMsQ0FBQywwQkFBMEIsRUFBRTtZQUM3QyxhQUFhLEVBQUU7Z0JBQ2IsWUFBWSxFQUFFLHVCQUF1QjthQUN0QztTQUNGLENBQUMsQ0FBQztRQUVILE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxPQUFPLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQzlFLFVBQVUsRUFBRSxRQUFRLENBQUMsVUFBVTtZQUMvQixTQUFTLEVBQUUsY0FBYztTQUMxQixDQUFDLENBQUM7UUFFSCxNQUFNLGNBQWMsR0FBRyxJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDMUUsVUFBVSxFQUFFLFFBQVEsQ0FBQyxVQUFVO1lBQy9CLFNBQVMsRUFBRSxRQUFRO1NBQ3BCLENBQUMsQ0FBQztRQUVILE1BQU0sdUJBQXVCLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSx5QkFBeUIsRUFBRTtZQUNuRixPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLE9BQU8sRUFBRSxzQkFBc0I7WUFDL0IsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQzNELENBQUMsQ0FBQztRQUVILHVCQUF1QixDQUFDLGVBQWUsQ0FDckMsSUFBSSx5QkFBZSxDQUFDO1lBQ2xCLE1BQU0sRUFBRSxnQkFBTSxDQUFDLEtBQUs7WUFDcEIsT0FBTyxFQUFFLENBQUMsb0JBQW9CLEVBQUUsZ0JBQWdCLEVBQUUsZUFBZSxDQUFDO1lBQ2xFLFNBQVMsRUFBRSxDQUFDLEdBQUcsQ0FBQztTQUNqQixDQUFDLENBQ0gsQ0FBQztRQUVGLFFBQVEsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLGlCQUFpQixFQUFFLHVCQUF1QixDQUFDLENBQUM7SUFDNUYsQ0FBQztDQUNGO0FBeEVELG9DQXdFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tIFwiYXdzLWNkay1saWJcIjtcclxuaW1wb3J0ICogYXMgY29nbml0byBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWNvZ25pdG9cIjtcclxuaW1wb3J0IHsgRWZmZWN0LCBQb2xpY3lTdGF0ZW1lbnQgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWlhbVwiO1xyXG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSBcImF3cy1jZGstbGliL2F3cy1sYW1iZGFcIjtcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcclxuaW1wb3J0IHBhdGggPSByZXF1aXJlKFwicGF0aFwiKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBDb2duaXRvU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xyXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcclxuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xyXG5cclxuICAgIGNvbnN0IHVzZXJQb29sID0gbmV3IGNvZ25pdG8uVXNlclBvb2wodGhpcywgXCJtb3ZpZVVzZXJQb29sXCIsIHtcclxuICAgICAgc2lnbkluQWxpYXNlczoge1xyXG4gICAgICAgIHVzZXJuYW1lOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgICBhY2NvdW50UmVjb3Zlcnk6IGNvZ25pdG8uQWNjb3VudFJlY292ZXJ5LkVNQUlMX09OTFksXHJcbiAgICAgIHNlbGZTaWduVXBFbmFibGVkOiB0cnVlLFxyXG4gICAgICBhdXRvVmVyaWZ5OiB7XHJcbiAgICAgICAgZW1haWw6IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICAgIHVzZXJWZXJpZmljYXRpb246IHtcclxuICAgICAgICBlbWFpbFN0eWxlOiBjb2duaXRvLlZlcmlmaWNhdGlvbkVtYWlsU3R5bGUuTElOSyxcclxuICAgICAgfSxcclxuICAgICAga2VlcE9yaWdpbmFsOiB7XHJcbiAgICAgICAgZW1haWw6IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICAgIHN0YW5kYXJkQXR0cmlidXRlczoge1xyXG4gICAgICAgIGdpdmVuTmFtZToge1xyXG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBmYW1pbHlOYW1lOiB7XHJcbiAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGJpcnRoZGF0ZToge1xyXG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbWFpbDoge1xyXG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgZW1haWw6IGNvZ25pdG8uVXNlclBvb2xFbWFpbC53aXRoQ29nbml0bygpLFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgdXNlclBvb2xDbGllbnQgPSB1c2VyUG9vbC5hZGRDbGllbnQoXCJicmllZkNpbmVtYUZlXCIsIHtcclxuICAgICAgcHJldmVudFVzZXJFeGlzdGVuY2VFcnJvcnM6IHRydWUsXHJcbiAgICB9KTtcclxuXHJcbiAgICB1c2VyUG9vbC5hZGREb21haW4oXCJicmllZkNpbmVtYUNvZ25pdG9Eb21haW5cIiwge1xyXG4gICAgICBjb2duaXRvRG9tYWluOiB7XHJcbiAgICAgICAgZG9tYWluUHJlZml4OiBcImJyaWVmY2luZW1hdXNlcnNiYWxzYVwiLFxyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgcmVndWxhclVzZXJHcm91cCA9IG5ldyBjb2duaXRvLkNmblVzZXJQb29sR3JvdXAodGhpcywgXCJyZWd1bGFyVXNlckdyb3VwXCIsIHtcclxuICAgICAgdXNlclBvb2xJZDogdXNlclBvb2wudXNlclBvb2xJZCxcclxuICAgICAgZ3JvdXBOYW1lOiBcIlJlZ3VsYXJVc2Vyc1wiLFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgYWRtaW5Vc2VyR3JvdXAgPSBuZXcgY29nbml0by5DZm5Vc2VyUG9vbEdyb3VwKHRoaXMsIFwiYWRtaW5Vc2VyR3JvdXBcIiwge1xyXG4gICAgICB1c2VyUG9vbElkOiB1c2VyUG9vbC51c2VyUG9vbElkLFxyXG4gICAgICBncm91cE5hbWU6IFwiQWRtaW5zXCIsXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBhZGRUb0RlZmF1bHRVc2VyR3JvdXBGbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgXCJhZGRUb0RlZmF1bHRVc2VyR3JvdXBGblwiLCB7XHJcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxyXG4gICAgICBoYW5kbGVyOiBcImluZGV4LmFkZFRvVXNlckdyb3VwXCIsXHJcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCBcIi4vc3JjXCIpKSxcclxuICAgIH0pO1xyXG5cclxuICAgIGFkZFRvRGVmYXVsdFVzZXJHcm91cEZuLmFkZFRvUm9sZVBvbGljeShcclxuICAgICAgbmV3IFBvbGljeVN0YXRlbWVudCh7XHJcbiAgICAgICAgZWZmZWN0OiBFZmZlY3QuQUxMT1csXHJcbiAgICAgICAgYWN0aW9uczogW1wiY29nbml0by1pZGVudGl0eToqXCIsIFwiY29nbml0by1zeW5jOipcIiwgXCJjb2duaXRvLWlkcDoqXCJdLFxyXG4gICAgICAgIHJlc291cmNlczogW1wiKlwiXSxcclxuICAgICAgfSlcclxuICAgICk7XHJcblxyXG4gICAgdXNlclBvb2wuYWRkVHJpZ2dlcihjb2duaXRvLlVzZXJQb29sT3BlcmF0aW9uLlBPU1RfQ09ORklSTUFUSU9OLCBhZGRUb0RlZmF1bHRVc2VyR3JvdXBGbik7XHJcbiAgfVxyXG59XHJcbiJdfQ==