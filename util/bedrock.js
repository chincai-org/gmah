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
                messages: [
                    {
                        role: "user",
                        content: [{ text: prompt }]
                    }
                ],
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
    }
}

export async function promptGenerateGrammarsTitle(
    language,
    previousTopics,
    numOfTopic,
    nativeLanguage,
    proficiencyLevelDescription
) {
    const prompt = `
	Generate a list of grammar topics for ${language}. Avoid topics from this list: ${previousTopics}.

	Format the response as:
	[ { "topic for grammar": "description" } ]

	Example:
	[ { "Verb": "Words that express actions, states, or occurrences. They can be categorized into action verbs, linking verbs, and auxiliary verbs." } ]

	Be specific and beginner-friendly, focusing on foundational grammar concepts to strengthen the learner's basics. Tailor the topics to the user's proficiency level described as "${proficiencyLevelDescription}". Generate ${numOfTopic} topics based on this format.

	Write the response in the user's native language (${nativeLanguage}).
	`;

    return await promptBedrock(prompt);
}

export async function promptGenerateVocabsTitle(
    language,
    previousTopics,
    numOfTopic,
    context,
    nativeLanguage,
    profficiencyLevelDescription
) {
    const prompt = `Generate a list of vocabulary topics for ${language}. Avoid topics from this list: ${previousTopics}. 

    Format the response as:
    [ { "topic for vocabulary": "number of words • proficiency level" } ]

    Example:
    [ { "Travel": "32 words • A1" } ]

    Base the vocabulary on this user interest: "${context}". Generate ${numOfTopic} topics. Ensure the description fits the format where the key is the topic and the value is the number of words and proficiency level.

    The user's proficiency level is described as "${profficiencyLevelDescription}", and their native language is ${nativeLanguage}. Write the response in their native language.`;

    return await promptBedrock(prompt);
}

export async function promptGenerateDialogueTitle(
    language,
    previousTopics,
    context,
    nativeLanguage,
    profficiencyLevelDescription
) {
    const prompt = `Create a real-life scenario for a ${language} enthusiast who wants to learn this language because of "${context}". Avoid scenarios related to this list: ${previousTopics}. 

    Format the response as: 
    { "scenario title": "short description" }

    Example:
    { "Ordering Coffee in Paris": "Learn how to confidently order coffee and pastries in a French café while practicing polite expressions and basic vocabulary." }

    The description should:
    - Be between 20 and 30 words.
    - Clearly explain the scenario's purpose and relevance to the learner's interest.

    Consider the user's native language (${nativeLanguage}) and proficiency level described as (${profficiencyLevelDescription}). Write the response in their native language.`;

    return await promptBedrock(prompt);
}
