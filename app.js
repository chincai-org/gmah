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
    getUserByUsername
} from "./util/database.js";
import { promptBedrock } from "./util/bedrock.js";

// Load environment variables from .env file
dotenv.config();

// for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
// const jwt = require("jsonwebtoken");
app.use(cookieParser());

// middlewares
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public"))); // serve static files
function cookieAuth(req, res, next) {
    const token = req.cookies?.token;
    if (!token) {
        return res.redirect("/login");
    }
    try {
        const decoded = jwt.verify(token, "super-secret");
        req.user = decoded; // store user info in request
        next();
    } catch (err) {
        return res.redirect("/login");
    }
}

// routes
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
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
    // ===== Validation Rules =====
    const nameRegex = /^[a-zA-Z0-9_-]{3,15}$/;
    const passwordMin = 6;
    const passwordMax = 30;

    // Check name
    if (!nameRegex.test(name)) {
        return res
            .status(400)
            .send(
                "Error: Name must be 3-15 characters, only letters, numbers, _ or - allowed."
            );
    }
    if (user) {
        console.log(user);
        return res
            .status(400)
            .send("Username taken, please try another username.");
    }

    // Check password length
    if (password.length < passwordMin || password.length > passwordMax) {
        return res
            .status(400)
            .send(
                `Error: Password must be between ${passwordMin}-${passwordMax} characters.`
            );
    }

    // If all good
    console.log("Signup data is valid! User can be created.");
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
    console.log(req.body);
    const user = await getUserByUsername(name);
    if (!user) {
        return res.status(400).send("Username doesn't exist");
    }
    if (verifyUserCredentials(user.id, password)) {
        // Create JWT (valid 7 days)
        const token = jwt.sign(
            { id: user.id, username: newUser.username },
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

const courses = [
    {
        id: 0,
        courseName: "Course1",
        native: "native1",
        lang: "Chinese",
        context: "None"
    },
    {
        id: 1,
        courseName: "Course2",
        native: "native2",
        lang: "Malay",
        context: "Hello"
    }
];

const dialogs = [
    {
        id: 0,
        title: "Going on the plane",
        info: "Wth with plane"
    },
    {
        id: 1,
        title: "balls",
        info: "hello"
    }
];

app.get("/dashboard", (req, res) => {
    res.render("dashboard", { courses: courses });
});

app.post("/createCourseVerifier", (req, res) => {
    console.log(req.body);
    const { courseName, native, lang, context } = req.body;
    if (
        !courseName.trim() ||
        !lang.trim() ||
        !context.trim() ||
        !native.trim()
    ) {
        return res.status(400).send("Error: Fields cannot be empty.");
    } else {
        courses.push({ ...req.body, id: courses.length }); //supposed to save it into db
    }
    res.redirect("/dashboard");
});

app.get("/courses/:id", (req, res) => {
    const course = courses.find(c => String(c.id) === String(req.params.id));
    if (!course) {
        return res.status(404).send("Course not found");
    }
    // Renders views/course.ejs (make sure this file exists)
    res.render("course", { course, dialogs });
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

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
