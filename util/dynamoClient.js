import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";

dotenv.config();

const REGION = process.env.AWS_REGION || "ap-southeast-5";
const IS_LOCAL = process.env.DYNAMO_LOCAL === "true";

let config = { region: REGION };

if (IS_LOCAL) {
    config = {
        region: "local",
        endpoint: "http://localhost:8000",
        credentials: {
            accessKeyId: "fakeKeyId",
            secretAccessKey: "fakeSecretKey"
        }
    };
}

const client = new DynamoDBClient(config);

console.log(
    `DynamoDB Client Configured for ${IS_LOCAL ? "Local" : REGION} Environment`
);

export const ddb = DynamoDBDocumentClient.from(client);
