import { PutCommand, GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "./dynamoClient.js";
import crypto from "crypto";

export const USERS_TABLE = process.env.USERS_TABLE || "user";
export const COURSES_TABLE = process.env.COURSES_TABLE || "course";
export const TOPICS_TABLE = process.env.TOPIC_TABLE || "topic";
export const QUESTIONS_TABLE = process.env.QUESTIONS_TABLE || "question";

export const TOPIC_TYPES = ["grammar", "vocabulary", "dialogue"];

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
    nativeLang,
    learningLang,
    context,
    langLevelDescription
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
        langLevelDescription,
        topics: {
            grammar: [],
            vocabulary: [],
            dialogue: []
        }
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

export async function putTopic(topicTitle, topicType, content, description) {
    const typeId = TOPIC_TYPES.indexOf(topicType);
    if (typeId === -1) {
        throw new Error("Invalid topic type");
    }

    const topicId = generateSnowflakeId();
    const topic = {
        topicId: topicId,
        title: topicTitle,
        type: typeId,
        content,
        description,
        items: []
    };

    await ddb.send(new PutCommand({ TableName: TOPICS_TABLE, Item: topic }));
    console.log("Topic added:", topic);
    return topic;
}

export async function getTopic(topicId) {
    const r = await ddb.send(
        new GetCommand({ TableName: TOPICS_TABLE, Key: { topicId } })
    );
    return r.Item || null;
}

export async function addTopicToCourse(courseId, topicId) {
    const course = await getCourse(courseId);
    const topic = await getTopic(topicId);

    if (!course) {
        throw new Error("Course not found");
    }

    if (!topic) {
        throw new Error("Topic not found");
    }

    course.topics[TOPIC_TYPES[topic.type]].push(topicId);

    await ddb.send(new PutCommand({ TableName: COURSES_TABLE, Item: course }));
}

export async function removeTopicFromCourse(courseId, topicId) {
    const course = await getCourse(courseId);
    const topic = await getTopic(topicId);

    if (!course) {
        throw new Error("Course not found");
    }

    if (!topic) {
        throw new Error("Topic not found");
    }

    course.Item.topics[TOPIC_TYPES[topic.Item.type]] = course.Item.topics[
        TOPIC_TYPES[topic.Item.type]
    ].filter(id => id !== topicId);

    await ddb.send(new PutCommand({ TableName: COURSES_TABLE, Item: course }));
}

export async function getItemsFromTopic(topicId) {
    const topic = await getTopic(topicId);
    if (!topic) {
        throw new Error("Topic not found");
    }

    return topic.items;
}

export async function addItemToTopic(topicId, item) {
    const topic = await getTopic(topicId);
    if (!topic) {
        throw new Error("Topic not found");
    }

    topic.items.push(item);

    await ddb.send(new PutCommand({ TableName: TOPICS_TABLE, Item: topic }));
    console.log("Item added to topic:", item);
    return topic;
}

export async function updateTopicItems(topicId, items) {
    const topic = await getTopic(topicId);
    if (!topic) {
        throw new Error("Topic not found");
    }

    topic.items = items;

    await ddb.send(new PutCommand({ TableName: TOPICS_TABLE, Item: topic }));
    console.log("Topic items updated:", topic);
    return topic;
}

/**
 *
 * @param {number} topicId
 * @param {Object} question Who knows what is inside question
 */
export async function createQuestion(question) {
    const questionId = generateSnowflakeId();
    const questionWithId = { questionId, ...question };

    await ddb.send(
        new PutCommand({
            TableName: QUESTIONS_TABLE,
            Item: questionWithId
        })
    );
    console.log("Question added:", questionWithId);
    return questionWithId;
}
