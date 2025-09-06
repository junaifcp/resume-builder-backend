// src/lib/dynamo.client.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

const REGION = process.env.AWS_REGION || "us-east-1";

const dynamoOpts: any = { region: REGION };

// Use local endpoint in development if provided
if (process.env.DYNAMODB_ENDPOINT) {
  dynamoOpts.endpoint = process.env.DYNAMODB_ENDPOINT;
}

export const dynamoClient = new DynamoDBClient(dynamoOpts);
export const ddbDocClient = DynamoDBDocumentClient.from(dynamoClient);

/** Get item by id */
export async function dynamoGetItem(table: string, id: string) {
  const cmd = new GetCommand({ TableName: table, Key: { id } });
  const res = await ddbDocClient.send(cmd);
  return res.Item;
}

/** Put item with optional ttl expiresAt (unix seconds) */
export async function dynamoPutItem(table: string, item: any) {
  const cmd = new PutCommand({ TableName: table, Item: item });
  await ddbDocClient.send(cmd);
}
