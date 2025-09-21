# 🌟 LinguaAI - AI-Powered Language Learning Platform

LinguaAI is an innovative platform designed to help users master grammar, vocabulary, and dialogues in various languages. With cutting-edge AI-powered content generation and an intuitive interface, LinguaAI makes language learning personalized, engaging, and effective.

---

## 🚀 Hosting Locally

Follow these steps to set up and run LinguaAI locally:

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher)
- [Docker](https://www.docker.com/) (for local DynamoDB)

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Start a local DynamoDB instance:
   ```bash
   docker run -p 8000:8000 amazon/dynamodb-local
   ```

4. Set up the local DynamoDB table:
   ```bash
   node scripts/localTableManager.js
   ```
   > This will create a table named `user`.

---

## 🌍 Deployment Instructions

To deploy LinguaAI:
1. Zip everything except `node_modules` and `.env`.
2. Upload the zip file to [AWS Elastic Beanstalk](https://ap-southeast-5.console.aws.amazon.com/elasticbeanstalk/home?region=ap-southeast-5#/environment/dashboard?environmentId=e-tyhth82n3m).

---

## 📝 Notes

- If the generation takes too long or the generated content is not relevant to the topic, press `Ctrl + R` to reload the page in the **Grammar**, **Vocabulary**, or **Dialogue** tabs.

---

## 💡 About GMAH

LinguaAI was developed as part of the [**GMAH Hackathon**](https://greataihackathon.com), showcasing the power of AI in revolutionizing language learning.

---
