// scripts/createTable.js
import {
    DynamoDBClient,
    CreateTableCommand,
    DeleteTableCommand,
    ListTablesCommand
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
    region: "local",
    endpoint: "http://localhost:8000",
    credentials: {
        accessKeyId: "fakeKeyId",
        secretAccessKey: "fakeSecretKey"
    }
});

export const USERS_TABLE = process.env.USERS_TABLE || "user";
export const COURSES_TABLE = process.env.COURSES_TABLE || "course";
export const TOPICS_TABLE = process.env.TOPIC_TABLE || "topic";
export const QUESTIONS_TABLE = process.env.QUESTIONS_TABLE || "question";

export async function createTable(tableName, attributeDefinitions, keySchema) {
    const cmd = new CreateTableCommand({
        TableName: tableName,
        AttributeDefinitions: attributeDefinitions,
        KeySchema: keySchema,
        BillingMode: "PAY_PER_REQUEST"
    });

    try {
        await client.send(cmd);
        console.log(`Table ${tableName} created!`);
    } catch (err) {
        if (err.name === "ResourceInUseException") {
            console.log(`Table ${tableName} already exists`);
        } else {
            throw err;
        }
    }
}

export async function deleteTable(tableName) {
    const cmd = new DeleteTableCommand({ TableName: tableName });

    try {
        await client.send(cmd);
        console.log(`Table ${tableName} deleted successfully`);
    } catch (err) {
        if (err.name === "ResourceNotFoundException") {
            console.log(`Table ${tableName} does not exist`);
        } else {
            throw err;
        }
    }
}

export async function listTables() {
    const cmd = new ListTablesCommand({});

    try {
        const response = await client.send(cmd);
        console.log("Tables:", response.TableNames);
    } catch (err) {
        console.error("Error listing tables:", err);
    }
}

async function setup() {
    // Create the user table
    await createTable(
        USERS_TABLE,
        [{ AttributeName: "id", AttributeType: "N" }],
        [{ AttributeName: "id", KeyType: "HASH" }]
    );

    // Create the courses table
    await createTable(
        COURSES_TABLE,
        [{ AttributeName: "courseId", AttributeType: "N" }],
        [{ AttributeName: "courseId", KeyType: "HASH" }]
    );

    // Create the topic table
    await createTable(
        TOPICS_TABLE,
        [{ AttributeName: "topicId", AttributeType: "N" }],
        [{ AttributeName: "topicId", KeyType: "HASH" }]
    );

    // Create the question table
    await createTable(
        QUESTIONS_TABLE,
        [{ AttributeName: "questionId", AttributeType: "N" }],
        [{ AttributeName: "questionId", KeyType: "HASH" }]
    );
}

setup();
