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

// Table name for easy editing
const TABLE_NAME = "user";

async function createTable() {
    const cmd = new CreateTableCommand({
        TableName: TABLE_NAME,
        AttributeDefinitions: [{ AttributeName: "id", AttributeType: "N" }],
        KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
        BillingMode: "PAY_PER_REQUEST"
    });

    try {
        await client.send(cmd);
        console.log(`Table ${TABLE_NAME} created!`);
    } catch (err) {
        if (err.name === "ResourceInUseException") {
            console.log(`Table ${TABLE_NAME} already exists`);
        } else {
            throw err;
        }
    }
}

async function deleteTable() {
    const cmd = new DeleteTableCommand({ TableName: TABLE_NAME });

    try {
        await client.send(cmd);
        console.log(`Table ${TABLE_NAME} deleted successfully`);
    } catch (err) {
        if (err.name === "ResourceNotFoundException") {
            console.log(`Table ${TABLE_NAME} does not exist`);
        } else {
            throw err;
        }
    }
}

async function listTables() {
    const cmd = new ListTablesCommand({});

    try {
        const response = await client.send(cmd);
        console.log("Tables:", response.TableNames);
    } catch (err) {
        console.error("Error listing tables:", err);
    }
}

// Example usage
// Uncomment the function you want to run
createTable();
// deleteTable();
// listTables();

// createTable();
