import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import { putUser, getUser } from "./util/database.js";

// Load environment variables from .env file
dotenv.config();

// for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// middlewares
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public"))); // serve static files

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

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

const courses = [
    {
        id: "1",
        name: "Course1",
        lang: "Chinese",
        context: "None"
    },
    {
        id: "2",
        name: "Course1",
        name: "Course2",
        lang: "Malay",
        context: "Hello"
    }
];

app.get("/menu", (req, res) => {
    res.render("menu", { courses: courses });
});
app.post("/menu", (req, res) => {
    console.log(req.body);
    const { name, lang, context } = req.body;
    if (!name.trim() || !lang.trim() || !context.trim()) {
        return res.status(400).send("Error: Fields cannot be empty.");
    } else {
        courses.push(req.body); //supposed to save it into db
    }
    res.redirect("/menu");
});

app.get("/courses/:id", (req, res) => {
    const course = courses.find(c => String(c.id) === String(req.params.id));
    if (!course) {
        return res.status(404).send("Course not found");
    }
    // Renders views/course.ejs (make sure this file exists)
    res.render("course", { course });
});
