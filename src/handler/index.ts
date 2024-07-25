import { 
  LambdaFunctionURLEventWithIAMAuthorizer, 
  LambdaFunctionURLResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const client =  new DynamoDBClient({ region: process.env.AWS_REGION });
export const handler = async (event: LambdaFunctionURLEventWithIAMAuthorizer ): Promise<LambdaFunctionURLResult> => {
  console.log('Event: ', event);
  console.log('body: ', event.body);
  const body = JSON.parse(event.body || '{}');
  return {
    headers: {
      'Content-Type': 'application/json'
    },
    statusCode: 200,
    body: JSON.stringify({
      method: event.requestContext.http.method,
      ...body
    })
  } satisfies LambdaFunctionURLResult;
}