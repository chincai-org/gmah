// utils/bedrock.js
import {
	BedrockRuntimeClient,
	InvokeModelCommand,
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
						content: [{ text: prompt }],
					},
				],
				inferenceConfig: {
					maxTokens: 200,
					temperature: 0.7,
				},
			}),
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
	previousTopic,
	numOfTopic
) {
	const prompt = `Generate a list of topic related to ${language} grammars. Do not generate topic related to this list ${previousTopic}. You must turn it in a format of [ { "topic for grammar" : "description" } ]. Please be extremely specific as if a beginner is learning grammar. Grammar is important to have the learner to be strong in the language's basics. Generate me ${numOfTopic} number of topic. For example the format should be [ { "verb" : "Words that express actions, states, or occurrences. They can be categorized into action verbs, linking verbs, and auxiliary verbs."}]. This fit the format where the key is topic for grammar and value is description. Please generate your prompt in their native language.`;
	try {
		const input = {
			modelId,
			contentType: "application/json",
			accept: "application/json",
			body: JSON.stringify({
				messages: [
					{
						role: "user",
						content: [
							{
								text: prompt,
							},
						],
					},
				],
				inferenceConfig: {
					maxTokens: 200,
					temperature: 0.7,
				},
			}),
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

export async function promptGenerateVocabsTitle(
	language,
	previousTopic,
	numOfTopic,
	context,
	nativeLanguage,
	profficiencyLevel
) {
	const prompt = `Generate a list of topic related to ${language}'s vocabulary. Do not generate topic related to this list ${previousTopic}. You must turn it in a format of [ { "topic for vocabulary" : "number of word • proficiency level" } ]. Generate the vocabulary base on this user interest "${context}". Generate me ${numOfTopic} number of topic. For example the format should be [ { "Travel" : "32 words • A1"}]. This fit the format where the key is topic for vocabulary and number of words • language profficiency level. The user profficiency level is ${profficiencyLevel} and their native language is ${nativeLanguage}. Please generate your prompt in their natvie language.`;
	try {
		const input = {
			modelId,
			contentType: "application/json",
			accept: "application/json",
			body: JSON.stringify({
				messages: [
					{
						role: "user",
						content: [
							{
								text: prompt,
							},
						],
					},
				],
				inferenceConfig: {
					maxTokens: 200,
					temperature: 0.7,
				},
			}),
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

export async function promptGenerateDialogueTitle(
	language,
	previousTopic,
	context,
	nativeLanguage,
	profficiencyLevel
) {
	const prompt = `Generate a real life scenario to a ${language} lover who want to learn this language because of this "${context}". Do not generate a scenario related to this list ${previousTopic}. Generate it in the format of {"scenario title" : "short description"}. For example {"meeting kim jung un" : "try not get excecuted as foreigner"}. In this case i have generate the scenario as the key and a short description about the topic as the value. The description describe what the topic is about and must be less than 30 words and more than 20 words. Generate scenario related to the user interest. Their native language is ${nativeLanguage} and their language profficiency level is ${profficiencyLevel}. Please generate your prompt in their native language.`;
	try {
		const input = {
			modelId,
			contentType: "application/json",
			accept: "application/json",
			body: JSON.stringify({
				messages: [
					{
						role: "user",
						content: [
							{
								text: prompt,
							},
						],
					},
				],
				inferenceConfig: {
					maxTokens: 200,
					temperature: 0.7,
				},
			}),
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
