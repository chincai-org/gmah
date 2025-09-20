// utils/bedrock.js
import {
    BedrockRuntimeClient,
    InvokeModelCommand
} from "@aws-sdk/client-bedrock-runtime";

const region = process.env.BEDROCK_REGION || "us-east-1";
const modelId = process.env.BEDROCK_MODEL_ID;

const client = new BedrockRuntimeClient({ region });

/**
 * Send a text prompt to the Bedrock model and get the response text.
 * Supports Nova models (messages API).
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
                // Nova expects "messages" array
                messages: [{ role: "user", content: [{ text: prompt }] }],
                inferenceConfig: {
                    maxTokens: 200,
                    temperature: 0.7
                }
            })
        };

        const command = new InvokeModelCommand(input);
        const response = await client.send(command);

        const decoded = new TextDecoder("utf-8").decode(response.body);
        const json = JSON.parse(decoded);

        // Nova returns `outputText`
        return json.outputText || JSON.stringify(json);
    } catch (err) {
        console.error("Bedrock prompt error:", err);
        throw err;
    }
}
