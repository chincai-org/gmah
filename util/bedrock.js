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
                    maxTokens: 1024,
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

export async function promptBedrockWithHistory(messageHistory) {
    try {
        const input = {
            modelId,
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify({
                // Nova expects "messages" array
                messages: messageHistory,
                inferenceConfig: {
                    maxTokens: 1024,
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
    const prompt = `Create a real-life scenario for a ${language} language enthusiast who wants to learn this language because of ${context}. Avoid scenarios related to this list: ${previousTopics}. 

    Format the response as: 
    { "<scenario title>": "<short description>" }

    Example:
    { "Ordering Coffee in Paris": "Learn how to confidently order coffee and pastries in a French café while practicing polite expressions and basic vocabulary." }

    The description should:
    - Be between 20 and 30 words.
    - Clearly explain the scenario's purpose and relevance to the learner's interest.

    Consider the user's native language ${nativeLanguage} and proficiency level described as ${profficiencyLevelDescription}. Write the response in their native language.`;

    return await promptBedrock(prompt);
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
    const prompt = `
	Based on the ${language} grammar lesson topic "${grammarTopic}", generate beginner-friendly multiple-choice questions to help the user learn the basics of this topic clearly and specifically.

	Format the response as:
	[
	{
		"question": "Insert the question text here",
		"options": ["option1", "option2", "option3", "option4"],
		"explanation": "why this answer is correct"
	}
	]

	Example:
	[
	{
		"question": "Choose the correct sentence:",
		"options": ["She plays the piano", "She play the piano", "She playing the piano", "She played the piano every day"],
		"explanation": "The subject 'she' is singular, so the verb needs an 's' at the end."
	}
	]

	Requirements:
	1. Generate ${numOfQuiz} questions in an array of JSON objects.
	2. The correct answer **must always be at index 0** in the "options" array.
	3. The incorrect options (index 1, 2, 3) must be plausible but incorrect.
	4. The questions must strictly test the grammar topic "${grammarTopic}".
	5. Ensure the questions are beginner-friendly and avoid advanced concepts.
	6. The explanation must clearly justify why the correct answer is correct.

	Focus on clarity and relevance to the grammar topic. Do not include unrelated or overly complex questions.
	`;

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
    const prompt = `Based on the ${language} vocabulary lesson "${vocabLesson}", generate vocabulary multiple-choice questions strictly related to the lesson. 

    Format the response as:
    [ 
      { 
        "question": "Insert the question text here",
        "options": ["option1", "option2", "option3", "option4"],
        "explanation": "why this answer is correct" 
      } 
    ]

    Example:
    [ 
      { 
        "question": "What does '旅行' mean?",
        "options": ["travel", "China", "walk", "run"],
        "explanation": "'旅行' means 'travel' in Chinese, making it the correct answer." 
      } 
    ]

    Requirements:
    1. Generate ${numOfQuiz} questions in an array of JSON objects.
    2. The correct answer **must always be at index 0**.
    3. The incorrect options (index 1, 2, 3) must be plausible but incorrect translations.
    4. The question must test vocabulary from the lesson "${vocabLesson}".
    5. The options must be in the user's native language (${nativeLanguage}).
    6. The explanation must clearly justify why the correct answer is correct.

    Ensure the questions are beginner-friendly and align with the vocabulary lesson. Do not include unrelated or advanced concepts.`;

    return await promptBedrock(prompt);
}

export function createSystemPrompt(
    language,
    nativeLanguage,
    scenario,
    userRole,
    aiRole
) {
    return `The scenario is described as: "${scenario}". You will roleplay as "${aiRole}" while the user plays the role of "${userRole}". For every user reply, you must:

    1. Provide **concise feedback** in ${nativeLanguage} on the user's response, focusing on:
    - What they did well.
    - Areas for improvement (grammar, vocabulary, or relevance to the scenario).

    2. Suggest a **better reply** in ${language} to help the user improve.

    3. Continue the roleplay conversation in ${language}, staying fully immersed in your role (${aiRole}). Provide a translation of your response in ${nativeLanguage} to assist the user.

    **Format**:
    Feedback: (insert your feedback in ${nativeLanguage})
    Better reply: (insert a better way for the user to respond in ${language})

    [${aiRole}]: (continue the roleplay conversation in ${language})
    [Translation]: (provide translation of your roleplay response in ${nativeLanguage})

    **Example Output** (with Malay as the learning language and English as the user's native language):
    Feedback: Your sentence is grammatically correct, but the vocabulary could be more relevant to the scenario.
    Better reply: Baiklah, cikgu. Saya akan membantu kamu mengangkat kerusi ke sana.

    [Guru Sekolah]: Selepas kamu mengangkat semua kerusi di sini, tolong cikgu panggil murid Ali ke bilik guru saya.
    [Translation]: After you carry all these chairs here, help me call the student Ali to my office.

    **Rules**:
    1. Stay committed to your role (${aiRole}) throughout the conversation.
    2. Do not break character or provide out-of-context responses.
    3. Ensure feedback is constructive and encouraging.
    4. Keep the conversation relevant to the scenario.
    `;
}

export async function _promptGenerateDialogue(
    language,
    nativeLanguage,
    scenario
) {
    const systemPrompt = `Given the roleplay of ${scenario}, you started the roleplay conversation. Now for every reply sent by the user, you should provide concise feedback on what they did good and what need to improve in ${nativeLanguage}. Feedback should be in ${nativeLanguage}. Then continue the roleplay conversation in ${language} replying to the user.
	Format:
	<START of message>
	Feedback: (insert your feedback in ${nativeLanguage})
	Better reply: (insert a better way for the user to response in ${language})

	[insert your role]: (continue the roleplay conversation in ${language} replying to user)
	[Translation]: (provide translation of your roleplay response in ${nativeLanguage})
	<END of message>
	Eample output with Malay as language learning and English as user's native language:
	<START of message>
	Feedback: Your use of the language is techinically correct, but the response is not releveant to the scenario.
	Better reply: Baiklah, cikgu. Saya akan membantu kamu mangangkat kerusi ke sana.
	
	[Guru Sekolah]: Selepas kamu mengangkat semua kerusi di sini, tolong cikgu panggil murid Ali ke bilik guru saya.
	[Translation]: After you carry all these chairs here, help me call the student Ali to my office.
	<END of message>
	`;
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

export async function _promptGenerateDialogueFirstSentence() {
    const prompt = `Based on a topic of Exploring Malaysian Markets with description Discover how to navigate local markets in Malaysia, learning essential phrases and cultural etiquette to enhance your experience., create a roleplaying scenario with 2 roles where one person is talking to another person. State my role and your role in chinese. Your response must be in malay. Give a conversation starter with your role. DO NOT GENERATE ANY OTHER DIALOGUE THAT IS NOT YOUR ROLE, WAIT FOR USER'S REPLY. DO NOT TYPE YOU ARE WAITING FOR MY REPLY. REMEMBER, YOU ARE ROLEPLAYING, AND NOW YOU ARE TALKING TO ME WHO IS PLAYING THE OTHER ROLE. STARTING NOW. START YOUR CONVERSATION WITH [(insert your role)]: what you going to say. For example [grampa]: hi my dear grandson. Here are rules to follow, Rules:

   - State my role and your role in chinese
   - Start the conversation in malay
   - Stay commited in your role, do not switch to other role, do not talk as someone else
   - Provided translation below the conversation in chinese to help me because i might not understand malay.

    Format: Your role: (insert your role)\n My role: (insert my role)\n Scenario: (insert the scenario/context)\n

    [insert your role]: (insert your starter conversation)\n [Translation]: (insert your translated starter conversation)\n `;

    return await promptBedrock(prompt);
}

export async function createScenario(title, description) {
    const prompt = `
    A scenario titled "${title}", described as "${description}". Your task is to write a **detailed and immersive scenario** based on the title and description provided.

    **Requirements**:
    1. Expand on the vague title and description to create a rich and engaging scenario.
    2. Clearly define the roles of two people involved in the scenario:
    - "person_1": (insert their role in the scenario, often the NPC or supporting character)
    - "person_2": (insert their role in the scenario, often the user or main character)

    **Format the response as JSON**:
    {
    "scenario": "Insert the detailed scenario description here",
    "roles": {
        "person_1": "Insert the role of the first person (e.g., Seller)",
        "person_2": "Insert the role of the second person (e.g., Customer)"
    }
    }

    **Example**:
    {
    "scenario": "A customer is asking the price of the apple at the supermarket. The seller provides the price and offers additional information about discounts on other fruits.",
    "roles": {
        "person_1": "Seller (Person 1 is often the NPC to the user)",
        "person_2": "Customer"
    }
    }

    **Rules**:
    1. Ensure the scenario is realistic and engaging.
    2. The roles must be relevant to the scenario and clearly defined.
    3. Do not include dialogue or additional details outside the specified format, the output must be a clean JSON without any blackticks.

    Generate the scenario in the specified JSON format.
    `;

    const response = await promptBedrock(prompt);

    console.log("createScenario response:", response);

    return JSON.parse(response);
}

export async function promptGenerateDialogueFirstSentence(
    scenario,
    userRole,
    aiRole,
    starterLanguage,
    translationLanguage
) {
    const prompt = `The scenario is described as: "${scenario}". Your task is to roleplay as "${aiRole}" while the user plays the role of "${userRole}". 

    **Instructions**:
    - Start the conversation in ${starterLanguage}.
    - Provide a conversation starter from your role (${aiRole}).
    - DO NOT generate any dialogue for the user's role (${userRole}). WAIT for the user's reply.
    - Provide a translation of your response in ${translationLanguage} to assist the user.

    **Rules**:
    - Stay committed to your role (${aiRole}). Do not switch roles or talk as someone else.
    - Ensure your response is relevant to the scenario.
    - Provide a translation below your response in ${translationLanguage}.

    **Format**:
    Your role: ${aiRole}
    My role: ${userRole}
    Scenario: ${scenario}

    [${aiRole}]: (insert your starter conversation)
    [Translation]: (insert your translated starter conversation)
    `;

    return await promptBedrock(prompt);
}
