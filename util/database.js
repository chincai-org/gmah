import { PutCommand, GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "./dynamoClient.js";
import crypto from "crypto";

export const USERS_TABLE = process.env.USERS_TABLE || "user";
export const COURSES_TABLE = process.env.COURSES_TABLE || "course";
export const TOPIC_TABLE = process.env.TOPIC_TABLE || "topic";

let sequence = 0;
const machineId = 1; // Unique ID for the machine or process

function generateSnowflakeId() {
    const timestamp = Date.now() - 1609459200000; // Offset from a custom epoch (e.g., Jan 1, 2021)
    sequence = (sequence + 1) % 4096; // Sequence number (12 bits)
    return (timestamp << 22) | (machineId << 12) | sequence;
}

export async function putUser(username, password) {
    // Generate a unique user ID using Snowflake-like algorithm
    const userId = generateSnowflakeId();

    // Hash the password using SHA-256
    const hashedPassword = crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");

    // Prepare the user object with the hashed password and generated ID
    const userWithId = {
        id: userId,
        username: username,
        password: hashedPassword // Replace plain password with hashed password
    };

    // Insert the user into the database
    await ddb.send(
        new PutCommand({ TableName: USERS_TABLE, Item: userWithId })
    );
    console.log("User added:", userWithId);
    return userWithId;
}

export async function getUser(userId) {
    const r = await ddb.send(
        new GetCommand({ TableName: USERS_TABLE, Key: { id: userId } })
    );
    return r.Item || null;
}

export async function updateUser(userId, username, password) {
    const user = await getUser(userId);
    if (!user) {
        throw new Error("User not found");
    }

    // Update username if provided
    if (username) {
        user.username = username;
    }

    // Update password if provided
    if (password) {
        const hashedPassword = crypto
            .createHash("sha256")
            .update(password)
            .digest("hex");
        user.password = hashedPassword;
    }

    await ddb.send(new PutCommand({ TableName: USERS_TABLE, Item: user }));
    console.log("User updated:", user);
    return user;
}

export async function getUserByUsername(username) {
    const params = {
        TableName: USERS_TABLE,
        FilterExpression: "username = :username",
        ExpressionAttributeValues: {
            ":username": username
        }
    };

    const response = await ddb.send(new ScanCommand(params));
    return response.Items && response.Items.length > 0
        ? response.Items[0]
        : null;
}

export async function verifyUserCredentials(userId, password) {
    const user = await getUser(userId);
    if (!user) return false;
    const hashedPassword = crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");
    return user.password === hashedPassword;
}

export async function putCourse(
    userId,
    courseName,
    nativeLang,
    learningLang,
    context
) {
    // Generate a unique course ID using Snowflake-like algorithm
    const courseId = generateSnowflakeId();

    const course = {
        courseId,
        courseName,
        userId,
        nativeLang,
        learningLang,
        context,
        topics: []
    };

    await ddb.send(new PutCommand({ TableName: COURSES_TABLE, Item: course }));
    console.log("Course added:", course);
    return course;
}

export async function getCourse(courseId) {
    const r = await ddb.send(
        new GetCommand({ TableName: COURSES_TABLE, Key: { courseId } })
    );
    return r.Item || null;
}

export async function createTopic() {
    // TODO: What the fuck does topic have
}

export async function addTopicToCourse(courseId, topicId) {
    const course = await ddb.send(
        new GetCommand({ TableName: COURSES_TABLE, Key: { courseId } })
    );

    if (!course.Item) {
        throw new Error("Course not found");
    }

    course.Item.topics.push(topicId);

    await ddb.send(
        new PutCommand({ TableName: COURSES_TABLE, Item: course.Item })
    );
}
