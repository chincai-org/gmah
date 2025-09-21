import { promptGenerateGrammarsTitle } from "./util/bedrock.js";
import dotenv from "dotenv";

dotenv.config();

console.log(
    await promptGenerateGrammarsTitle(
        "Bahasa Melayu",
        [],
        5,
        "Chinese",
        "我会基本马来文单词"
    )
);
