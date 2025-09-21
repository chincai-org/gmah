import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

import {
    putUser,
    getUser,
    verifyUserCredentials,
    getUserByUsername,
    updateUser,
    putCourse,
    getCourse,
    findCoursesByUserId,
    findTopicsByCourseId,
    putTopic,
    addTopicToCourse,
    addItemToTopic,
    getTopic,
    addItemsToTopic,
    updateTopicItems
} from "./util/database.js";

import {
    promptBedrock,
    promptGenerateGrammarsTitle,
    promptGenerateVocabsTitle,
    promptGenerateGrammarLesson,
    promptGenerateGrammarQuiz,
    promptGenerateVocabLesson,
    promptGenerateVocabQuiz,
    promptGenerateDialogueTitle,
    createScenario,
    createSystemPrompt,
    promptGenerateDialogueFirstSentence,
    promptBedrockWithHistory
} from "./util/bedrock.js";

// Load environment variables from .env file
dotenv.config();

// for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
app.use(cookieParser());

// middlewares
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public"))); // serve static files

function cookieAuth(req, res, next) {
    const token = req.cookies?.token;
    if (!token) {
        console.log("Please log in");
        return res.redirect("/login");
    }
    try {
        const decoded = jwt.verify(token, "super-secret");
        req.user = decoded; // store user info in request
        next();
    } catch (err) {
        console.log("Cookie invalid. Please log in!");
        return res.redirect("/login");
    }
}

function getUserIdFromCookie(req) {
    const token = req.cookies?.token;
    if (!token) {
        throw new Error("No token found in cookies");
    }

    try {
        const decoded = jwt.verify(token, "super-secret"); // Replace "super-secret" with your actual secret key
        return decoded.id; // Extract the user ID from the decoded token
    } catch (err) {
        throw new Error("Invalid token");
    }
}

async function signup_verification(name, password) {
    // ===== Validation Rules =====
    const nameRegex = /^[a-zA-Z0-9_-]{3,15}$/;
    const passwordMin = 6;
    const passwordMax = 30;

    // Check name
    if (!nameRegex.test(name)) {
        return "Error: Name must be 3-15 characters, only letters, numbers, _ or - allowed.";
    }

    // Check password length
    if (password.length < passwordMin || password.length > passwordMax) {
        return `Error: Password must be between ${passwordMin}-${passwordMax} characters.`;
    }

    // All good
    return "";
}

// routes
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/landing_page.html"));
});

app.post("/user", async (req, res) => {
    try {
        const { userId, name } = req.body;
        if (!userId || !name) {
            return res.status(400).send("Missing userId or name");
        }
        const user = { id: userId, name };
        await putUser(user);
        res.json({ message: "User saved!", user });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error saving user");
    }
});

app.get("/user/:id", async (req, res) => {
    try {
        const user = await getUser(req.params.id);
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching user");
    }
});

app.get("/new", (req, res) => {
    res.render("newCourse");
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public/login.html"));
});

app.post("/signup-verifier", async (req, res) => {
    const { name, password } = req.body;
    console.log(req.body);
    const user = await getUserByUsername(name);
    if (user) {
        console.log(user);
        return res
            .status(400)
            .send("Username taken, please try another username.");
    }
    const check = await signup_verification(name, password);
    if (check) {
        return res.status(400).send(check);
    } else {
        console.log("Signup data is valid! User can be created.");
    }

    try {
        // Create the user in DynamoDB
        const newUser = await putUser(name, password);

        // Create JWT (valid 7 days)
        const token = jwt.sign(
            { id: newUser.id, username: newUser.username },
            "super-secret", // 🔑 move this to process.env.JWT_SECRET in real app
            { expiresIn: "7d" }
        );

        // Set cookie with 7-day expiry
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
        });

        res.redirect("/dashboard");
    } catch (err) {
        console.error("Error creating user:", err);
        res.status(500).send("Internal server error.");
    }
});

app.post("/login-verifier", async (req, res) => {
    const { name, password } = req.body;
    const user = await getUserByUsername(name);
    if (!user) {
        return res.status(400).send("Username doesn't exist");
    }
    if (verifyUserCredentials(user.id, password)) {
        // Create JWT (valid 7 days)
        const token = jwt.sign(
            { id: user.id, username: user.username },
            "super-secret", // 🔑 move this to process.env.JWT_SECRET in real app
            { expiresIn: "7d" }
        );

        // Set cookie with 7-day expiry
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
        });

        res.redirect("/dashboard");
    } else {
        return res.send("Wrong password");
    }
});

// const dialogs = [
//     {
//         id: 0,
//         title: "Going on the plane",
//         info: "Wth with plane"
//     },
//     {
//         id: 1,
//         title: "balls",
//         info: "hello"
//     }
// ];

app.get("/dashboard", cookieAuth, async (req, res) => {
    const id = getUserIdFromCookie(req);

    console.log("Current user:", id);

    const courses = await findCoursesByUserId(id);

    console.log("User courses:", courses);

    res.render("dashboard", { courses: courses });
});

app.post("/createCourseVerifier", async (req, res) => {
    try {
        const { courseName, native, lang, context, level } = req.body;

        if (
            !courseName.trim() ||
            !lang.trim() ||
            !context.trim() ||
            !native.trim()
        ) {
            return res.status(400).send("Error: Fields cannot be empty.");
        }

        // Get user ID from cookie
        const userId = getUserIdFromCookie(req);

        // Save course to database
        await putCourse(userId, courseName, native, lang, context, level);

        res.redirect("/dashboard");
    } catch (err) {
        console.error(err.message);
        res.status(401).send("Unauthorized: " + err.message);
    }
});

async function mapTopics(topicIds) {
    const topics = [];
    for (const topicId of topicIds) {
        const topic = await getTopic(topicId);
        if (topic) {
            topics.push(topic);
        }
    }
    return topics;
}

app.get("/courses/:id", async (req, res) => {
    const course = await getCourse(parseInt(req.params.id));
    if (!course) {
        return res.status(404).send("Course not found");
    }

    console.log(course);

    const grammar = await mapTopics(course.topics.grammar);
    const vocab = await mapTopics(course.topics.vocabulary);
    const dialogs = await mapTopics(course.topics.dialogue);

    console.log("Grammar topics:", grammar);

    // Renders views/course.ejs (make sure this file exists)
    res.render("course", { course, dialogs, grammar, vocab });
});

app.post("/courses/:id/grammar/generate", async (req, res) => {
    try {
        const courseId = parseInt(req.params.id, 10);
        const course = await getCourse(courseId);
        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }

        const previousTopics = await mapTopics(course.topics.grammar);
        console.log("Previous topics:", previousTopics);
        const previousTopicsTitles = previousTopics.map(t => t.title);

        console.log("Previous topics:", previousTopicsTitles);

        // Call Bedrock or other AI service to generate lesson content
        const output = await promptGenerateGrammarsTitle(
            course.learningLang,
            previousTopicsTitles,
            5,
            course.nativeLang,
            course.langLevelDescription
        );

        console.log("Raw AI output:", output);

        const topics = JSON.parse(output);

        if (!topics || !Array.isArray(topics) || topics.length === 0) {
            return res.status(500).json({ error: "Failed to generate topics" });
        }

        const topicObjects = [];

        for (const topic of topics) {
            const [title, description] = Object.entries(topic)[0];
            topicObjects.push({ title, description });

            const dbTopic = await putTopic(
                title,
                "grammar",
                await promptGenerateGrammarLesson(course.learningLang, title),
                description
            );
            await addTopicToCourse(courseId, dbTopic.topicId);

            const quizzesOutput = await promptGenerateGrammarQuiz(
                course.learningLang,
                7,
                dbTopic.content,
                course.nativeLang
            );

            console.log("Raw quiz output:", quizzesOutput);

            const quizzes = JSON.parse(quizzesOutput);

            await addItemsToTopic(dbTopic.topicId, quizzes);
        }

        res.json({ topics: topicObjects });
    } catch (err) {
        console.error("Generate grammar error:", err);
        res.status(500).json({ error: "Failed to generate lesson" });
    }
});

app.post("/courses/:id/vocab/generate", async (req, res) => {
    try {
        const courseId = parseInt(req.params.id, 10);
        const course = await getCourse(courseId);
        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }

        const previousTopics = await mapTopics(course.topics.vocabulary);
        const previousTopicsTitles = previousTopics.map(t => t.title);

        // Call Bedrock or other AI service to generate lesson content
        const output = await promptGenerateVocabsTitle(
            course.learningLang,
            previousTopicsTitles,
            5,
            course.nativeLang,
            course.langLevelDescription
        );

        console.log(output);

        console.log("Raw AI output:", output);

        const topics = JSON.parse(output);

        if (!topics || !Array.isArray(topics) || topics.length === 0) {
            return res.status(500).json({ error: "Failed to generate topics" });
        }

        const topicObjects = [];

        for (const topic of topics) {
            const [title, description] = Object.entries(topic)[0];
            topicObjects.push({ title, description });

            const lesson = await promptGenerateVocabLesson(
                course.learningLang,
                title
            );

            const dbTopic = await putTopic(
                title,
                "vocabulary",
                lesson,
                description
            );
            await addTopicToCourse(courseId, dbTopic.topicId);

            const quizzesOutput = await promptGenerateVocabQuiz(
                course.learningLang,
                7,
                lesson,
                course.nativeLang
            );

            // console.log("Raw quiz output:", quizzesOutput);

            const quizzes = JSON.parse(quizzesOutput);

            await addItemsToTopic(dbTopic.topicId, quizzes);
        }

        res.json({ topics: topicObjects });
    } catch (err) {
        console.error("Generate vocabulary error:", err);
        res.status(500).json({ error: "Failed to generate lesson" });
    }
});

app.post("/courses/:id/dialog/generate", async (req, res) => {
    try {
        const courseId = parseInt(req.params.id, 10);
        const course = await getCourse(courseId);
        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }

        // const dialog = {
        //     id: Date.now(),
        //     title: "New Dialogue",
        //     info: "Generated conversation"
        // };

        // Optionally: save to DB here if you want persistence

        const previousTopics = await mapTopics(course.topics.dialogue);
        const previousTopicsTitles = previousTopics.map(t => t.title);

        // Call Bedrock or other AI service to generate lesson content
        const output = await promptGenerateDialogueTitle(
            course.learningLang,
            previousTopicsTitles,
            course.context,
            course.nativeLang,
            course.langLevelDescription
        );

        console.log("Raw AI output:", output);

        const [title, description] = Object.entries(JSON.parse(output))[0];

        const dbTopic = await putTopic(title, "dialogue", "", description);

        await addTopicToCourse(courseId, dbTopic.topicId);

        const { scenario, roles } = await createScenario(title, description);
        const { person_1, person_2 } = roles;

        const systemMessage = createSystemPrompt(
            course.learningLang,
            course.nativeLang,
            scenario,
            person_2,
            person_1
        );

        const firstMessage = await promptGenerateDialogueFirstSentence(
            scenario,
            person_2,
            person_1,
            course.learningLang,
            course.nativeLang
        );

        const chat = [
            { role: "user", content: [{ text: systemMessage }] },
            { role: "assistant", content: [{ text: firstMessage }] }
        ];

        await addItemsToTopic(dbTopic.topicId, chat);

        res.json({ dialog: dbTopic });
    } catch (err) {
        console.error("Generate dialogue error:", err);
        res.status(500).json({ error: "Failed to generate dialogue" });
    }
});

app.get("/getDialogues/:id", async (req, res) => {
    try {
        const topicId = parseInt(req.params.id, 10);
        const topic = await getTopic(topicId);
        console.log("Get dialogues topic:", topic);
        if (!topic) {
            return res.status(404).send("Topic not found");
        }

        const response = {
            dialogue: topic.items.map(item => {
                return { who: item.role, text: item.content[0].text };
            })
        };

        console.log("Get dialogues response:", response);

        return res.json(response);
    } catch (err) {
        console.error("Get dialogues error:", err);
        res.status(500).json({ error: "Failed to get dialogues" });
    }
});

app.post("/getResponse/:id", async (req, res) => {
    try {
        const topicId = parseInt(req.params.id, 10);
        const topic = await getTopic(topicId);
        if (!topic) {
            return res.status(404).send("Topic not found");
        }

        const userMessage = req.body.message;
        if (!userMessage || !userMessage.trim()) {
            return res.status(400).json({ error: "Message cannot be empty" });
        }

        const chat = [
            ...topic.items,
            { role: "user", content: [{ text: userMessage }] }
        ];

        console.log("Chat history for response:", chat);

        const reply = await promptBedrockWithHistory(chat);

        console.log("AI reply:", reply);

        // Save user message and AI reply to topic items
        topic.items.push({ role: "user", content: [{ text: userMessage }] });
        topic.items.push({ role: "assistant", content: [{ text: reply }] });

        await updateTopicItems(topicId, topic.items);

        res.json({ reply });
    } catch (err) {
        console.error("Get response error:", err);
        res.status(500).json({ error: "Failed to get response" });
    }
});

app.get("/ask", async (req, res) => {
    const q = req.query.q || "Hello";
    try {
        const answer = await promptBedrock(q);
        res.json({ question: q, answer });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get("/logout", (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        sameSite: "strict"
    });

    res.redirect("/landing_page.html");
});

app.get("/edit-profile", (req, res) => {
    res.sendFile(path.join(__dirname, "public/edit_profile.html"));
});

app.get("/profile", cookieAuth, (req, res) => {
    console.log("current user info", req.user);
    res.render("profile", { user: req.user });
});

app.post("/profile", cookieAuth, async (req, res) => {
    const { name, password } = req.body;
    const check = await signup_verification(name, password);
    if (check) {
        return res.status(400).send(check);
    } else {
        console.log("Signup data is valid! User can be created.");

        const user = req.user;
        const updatedUser = await updateUser(user.id, name, password);
        const token = jwt.sign(
            { id: updatedUser.id, username: updatedUser.username },
            "super-secret",
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.redirect("/profile");
    }
});

app.get("/testcookie", cookieAuth, (req, res) => {
    res.send("You have cookie and is valid");
});

app.get("/grammar/:id", async (req, res) => {
    const topicId = +req.params.id;
    const topic = await getTopic(topicId);
    if (!topic) {
        return res.status(404).send("Topic not found");
    }

    for (let i = 0; i < topic.items.length; i++) {
        const item = topic.items[i];
        const options = item.options.map((opt, index) => ({
            text: opt,
            correct: false
        }));
        options[0].correct = true;
        topic.items[i].options = options.sort(() => Math.random() - 0.5);
    }

    console.log(topic);

    res.render("grammar", { topic });
});

app.get("/vocab/:id", async (req, res) => {
    const topicId = +req.params.id;
    const topic = await getTopic(topicId);
    if (!topic) {
        return res.status(404).send("Topic not found");
    }

    for (let i = 0; i < topic.items.length; i++) {
        const item = topic.items[i];
        const options = item.options.map((opt, index) => ({
            text: opt,
            correct: false
        }));
        options[0].correct = true;
        topic.items[i].options = options.sort(() => Math.random() - 0.5);
    }

    console.log(topic);

    res.render("grammar", { topic });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
