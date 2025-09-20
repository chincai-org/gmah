// utils/bedrock.js
import {
    BedrockRuntimeClient,
    InvokeModelCommand
} from "@aws-sdk/client-bedrock-runtime";

const region = process.env.BEDROCK_REGION || "us-east-1";
const modelId = process.env.BEDROCK_MODEL_ID || "anthropic.claude-v2:1"; // fallback default

const client = new BedrockRuntimeClient({ region });

/**
 * Send a text prompt to the Bedrock model and get the response text.
 * @param {string} prompt - The text to send to the model.
 * @returns {Promise<string>} - The model's reply text.
 */
export async function promptBedrock(prompt) {
    try {
        const input = {
            modelId,
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify({
                // Anthropic Claude-style request shape (adjust if using other providers!)
                prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
                max_tokens_to_sample: 200,
                temperature: 0.7
            })
        };

        const command = new InvokeModelCommand(input);
        const response = await client.send(command);

        const decoded = new TextDecoder("utf-8").decode(response.body);
        const json = JSON.parse(decoded);

        // For Anthropic models the field is "completion"
        return json.completion || JSON.stringify(json);
    } catch (err) {
        console.error("Bedrock prompt error:", err);
        throw err;
    }
}
