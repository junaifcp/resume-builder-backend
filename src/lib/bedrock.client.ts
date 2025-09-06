// src/lib/bedrock.client.ts
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const REGION = process.env.AWS_REGION || "us-east-1";

export const bedrockClient = new BedrockRuntimeClient({
  region: REGION,
  // If you're using env AWS credentials (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY),
  // the SDK will pick them up automatically. If running on EC2/ECS/Lambda, use an IAM role.
});

/**
 * Safely convert InvokeModel response body (async iterable) to string.
 */
async function streamToString(body: any): Promise<string> {
  if (!body) return "";
  // If the body is already a string
  if (typeof body === "string") return body;

  const chunks: Uint8Array[] = [];
  // `body` is often an async iterable (for Node), iterate over chunks
  for await (const chunk of body as any) {
    if (typeof chunk === "string") {
      chunks.push(Buffer.from(chunk));
    } else if (typeof chunk === "number") {
      // unlikely, but handle gracefully
      chunks.push(Buffer.from([chunk]));
    } else {
      // chunk is probably Uint8Array or Buffer-like
      chunks.push(Buffer.from(chunk));
    }
  }
  return Buffer.concat(chunks).toString("utf8");
}

/**
 * Generic invoker for Bedrock models.
 *
 * @param modelId - Bedrock model ID (e.g. amazon.titan-text-lite-v1)
 * @param bodyObj - JS object payload; will be JSON.stringified
 * @param accept - accept header (default application/json)
 * @param contentType - content-type header (default application/json)
 *
 * Returns parsed JSON where possible, otherwise returns raw string.
 */
export async function invokeBedrockModel(
  modelId: string,
  bodyObj: any,
  accept = "application/json",
  contentType = "application/json"
): Promise<any> {
  // Ensure body is string or Buffer
  const bodyString =
    typeof bodyObj === "string" ? bodyObj : JSON.stringify(bodyObj);

  const command = new InvokeModelCommand({
    modelId,
    body: bodyString, // SDK accepts string or Uint8Array
    accept,
    contentType,
  });

  const response = await bedrockClient.send(command);

  const raw = await streamToString(response.body);
  // Try parse JSON. Many bedrock responses are JSON; some may be plain text.
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}
