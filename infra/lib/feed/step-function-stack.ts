import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export interface StepFunctionStackProps extends cdk.StackProps {
    getSubscriptionsFnArn: string;
    getRatingsFnArn: string;
    getDownloadsFnArn: string;
    generateFeedFnArn: string;
}

export class StepFunctionStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: StepFunctionStackProps) {
        super(scope, id, props);

        const { getSubscriptionsFnArn, getRatingsFnArn, getDownloadsFnArn, generateFeedFnArn } = props;

        const getSubscriptionsTask = new tasks.LambdaInvoke(this, 'GetSubscriptions', {
            lambdaFunction: lambda.Function.fromFunctionArn(this, 'GetSubscriptionsFunction', getSubscriptionsFnArn),
            payload: stepfunctions.TaskInput.fromObject({
                headers: {
                    Authorization: stepfunctions.JsonPath.stringAt('$.Authorization')
                }
            }),
            resultPath: '$.subscriptionsResult',
        });

        const getRatingsTask = new tasks.LambdaInvoke(this, 'GetRatings', {
            lambdaFunction: lambda.Function.fromFunctionArn(this, 'GetRatingsFunction', getRatingsFnArn),
            payload: stepfunctions.TaskInput.fromObject({
                headers: {
                    Authorization: stepfunctions.JsonPath.stringAt('$.Authorization')
                }
            }),
            resultPath: '$.ratingsResult',
        });

        const getDownloadsTask = new tasks.LambdaInvoke(this, 'GetDownloads', {
            lambdaFunction: lambda.Function.fromFunctionArn(this, 'GetDownloadsFunction', getDownloadsFnArn),
            payload: stepfunctions.TaskInput.fromObject({
                headers: {
                    Authorization: stepfunctions.JsonPath.stringAt('$.Authorization')
                }
            }),
            resultPath: '$.downloadsResult',
        });

        const parallelState = new stepfunctions.Parallel(this, 'ParallelTasks', {
            resultPath: '$.parallelResults',
        });

        parallelState.branch(getSubscriptionsTask);
        parallelState.branch(getRatingsTask);
        parallelState.branch(getDownloadsTask);

        const generateFeedTask = new tasks.LambdaInvoke(this, 'GenerateFeed', {
            lambdaFunction: lambda.Function.fromFunctionArn(this, 'GenerateFeedFunction', generateFeedFnArn),
            payload: stepfunctions.TaskInput.fromObject({
                subscriptions: stepfunctions.JsonPath.stringAt('$.parallelResults[0].subscriptionsResult.Payload'),
                ratings: stepfunctions.JsonPath.stringAt('$.parallelResults[1].ratingsResult.Payload'),
                downloads: stepfunctions.JsonPath.stringAt('$.parallelResults[2].downloadsResult.Payload'),
            }),
            resultPath: '$.feedResult',
        });

        const chain = stepfunctions.Chain.start(parallelState).next(generateFeedTask);

        new stepfunctions.StateMachine(this, 'GetFeedStateMachine', {
            definitionBody: stepfunctions.DefinitionBody.fromChainable(chain),
            timeout: cdk.Duration.minutes(5),
        });
    }
}
