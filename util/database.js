// lib/repos.js
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "./dynamoClient.js";

const USERS_TABLE = process.env.USERS_TABLE || "user";

export async function putUser(user) {
    console.log(USERS_TABLE);
    await ddb.send(new PutCommand({ TableName: USERS_TABLE, Item: user }));
    return user;
}

export async function getUser(userId) {
    const r = await ddb.send(
        new GetCommand({ TableName: USERS_TABLE, Key: { id: userId } })
    );
    return r.Item || null;
}
