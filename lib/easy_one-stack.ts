import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { custom_resources } from 'aws-cdk-lib';

export class MeraparLowHangingFruitStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // dynamodb
    const table = new dynamodb.Table(this, 'MeraparLowHangingFruitDemoTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
    });

    // seed
    new custom_resources.AwsCustomResource(this, 'MeraparLowHangingFruitDemoData', {
      onCreate: {
        service: 'DynamoDB',
        action: 'putItem',
        parameters: {
          TableName: table.tableName,
          Item: {
            id: {S: 'value'},
            text: { S: 'Hello, Merapar &#128522;' },
          }
        },
        physicalResourceId: custom_resources.PhysicalResourceId.of(Date.now().toString()),
      },
      policy: custom_resources.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [table.tableArn],
      }),
    });

    // lambda
    const func = new lambda.Function(this, 'MeraparLowHangingFruitDemoFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');
        const client = new DynamoDBClient({});
        exports.handler = async function(event) {
          const params = {
            TableName: process.env.TABLE_NAME,
            Key: {
              id: { S: 'value' },
            },
          };
          const data = await client.send(new GetItemCommand(params));
          const value = data.Item ? data.Item.text.S : 'No value found';
          const html = \`<html><body><h1>The saved string is \${value}</h1></body></html>\`;
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html' },
            body: html,
          };
        };
      `),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    table.grantReadData(func);

    const api = new apigateway.LambdaRestApi(this, 'MeraparLowHangingFruitDemoApi', {
      handler: func,
    });

    new cdk.CfnOutput(this, 'MeraparLowHangingFruitApiUrl', {
      value: api.url,
    });
  }
}
