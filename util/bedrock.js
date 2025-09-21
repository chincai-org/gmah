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
                    maxTokens: 500,
                    temperature: 0.7
                }
            })
        };

        const command = new InvokeModelCommand(input);
        const response = await client.send(command);

        const decoded = new TextDecoder("utf-8").decode(response.body);
        const json = JSON.parse(decoded);

        // Nova returns `outputText`
        return json.output.message.content[0].text || JSON.stringify(json);
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

export async function promptGenerateDialogueStarter(
    language,
    scenario,
    scenarioDescription,
    context,
    nativeLanguage,
    proficiencyLevel
) {
    const systemPrompt = `You are now a language teacher, you are not allowed to be a racist, you are kind and patient teacher willing to help out people to learn a language they wnat. You give them specific and clear feedback to improve the user. When given a scenario with its description and prompted to act a character to help the user, you will choose a character and a character for the user such that the user can improve their language they wish to learn for his purpose When given a scenario with its description and prompted to act a character to help the user, you will choose a character and a character for the user such that the user can improve their language they wish to learn for his purpose.`;
    const prompt = `In a scenario of ${scenario} with description of ${scenarioDescription}, Choose a character you want to act base on the scenario above and choose a character the user should act, start a conversation with the user to train them knowing their native language is ${nativeLanguage} and they wanting to learn malay because ${context}. When the user reply your conversation, provide a feedback on the user reply from the perspective of ${language} native speaker base one how natural the user reply before continuing the conversation to reply the user. This conversation will go on until the user decide to stop talking. Remeber to speak with the language they want to learn which is ${language}, you want to help the person to be excellent in ${language} as their proficiency level can be describe as ${proficiencyLevel}.`;
    try {
        const input = {
            modelId,
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify({
                messages: [
                    {
                        role: "system",
                        content: [
                            {
                                text: systemPrompt
                            }
                        ]
                    },
                    {
                        role: "user",
                        content: [
                            {
                                text: prompt
                            }
                        ]
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

        return json.outputText || JSON.stringify(json);
    } catch (err) {
        console.error("Bedrock prompt error:", err);
    }
}

export async function promptGenerateGrammarLesson(language, grammarTopic) {
    const prompt = `Base on the language ${language} grammar lesson topic ${grammarTopic}. You must expect the user is a beginner and must learn the basics of grammar and everything about this topic clearly and specifically. Your lesson must include examples at the end and teach about the lesson at the beginning of your text. Your lesson can include when to use it and and mistakes to avoid. You can generate all nicely in a markdown format. Generate anything extra you think learner need to learn. Do not generate quiz or practice to test the user, only provide knowledge and information.`;

    return await promptBedrock(prompt);
}

export async function promptGenerateGrammarQuiz(
    language,
    grammarTopic,
    numOfQuiz
) {
    const prompt = `Base on the ${language} grammar lesson topic ${grammarTopic}. You must expect the user is a beginner and must learn the basics of grammar and everything about this topic clearly and specifically. You should generate a multiple choice question with 4 options. The generated format should be {"question" : ["option1", "option2", "option3", "option4"], "explaination" : "why this answer correct" }. For example {"Choose the correct answer" : ["She plays the piano", "She play the piano", "She playing the piano", "She played the piano every day"], "explaination" : "she is singular so need s at the back"}. Generate ${numOfQuiz} question in an array of json. The correct answer must be at index 0. DO NOT have the correct answer at index 1,2 and 3.`;

    return await promptBedrock(prompt);
}

export async function promptGenerateVocabLesson(
    language,
    vocabTopic,
    context,
    nativeLanguage,
    numOfWord,
    proficiencyLevelDescription
) {
    const prompt = `Base on the language ${language} vocabulary lesson topic ${vocabTopic}. the user native language is ${nativeLanguage} and his proficiency level of ${language} can be describe as ${proficiencyLevelDescription}. He decide to learn ${language} because of ${context}. Your lesson must include ${numOfWord} new word the user learn and explaination next to it generated in the format of word: explaination. The new word must be in ${language} and the explaination must be in ${nativeLanguage}. You can generate all nicely in a markdown format. Generate ONLY ${numOfWord} new words for the user to learn BASED ON his proficiency level and their NATIVE LANGUAGE. Do not generate quiz or practice to test the user, only provide knowledge and information.`;

    return await promptBedrock(prompt);
}

export async function promptGenerateVocabQuiz(
    language,
    numOfQuiz,
    vocabLesson,
    nativeLanguage
) {
    const prompt = `Base on the ${language} vocabulary lesson ${vocabLesson}. Generate vocabulary multiple choice questions that are ONLY related to the vocabulary lesson. The generated format should be {"question" : ["option1", "option2", "option3", "option4"], "explaination" : "why this answer correct" }. For example {"旅行" : ["travel", "china", "walk", "run"], "explaination" : "this is the correct way to say it in chinese"}. Generate ${numOfQuiz} question in an array of json. The correct answer must be at index 0. DO NOT have the correct answer at index 1,2 and 3. The question MUST be testing the vocabulary of ${language} and the options MUST be in ${nativeLanguage} language.`;

    return await promptBedrock(prompt);
}
