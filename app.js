import express from "express";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("src"));

app.get("/", (req, res) => {
    res.sendFile(process.cwd() + "/src/html/index.html");
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
