# 🌟 **LinguaAI** - AI-Powered Language Learning Platform

LinguaAI is an innovative platform designed to help users master grammar, vocabulary, and dialogues in various languages. With cutting-edge AI-powered content generation and an intuitive interface, LinguaAI makes language learning personalized, engaging, and effective.

---

## ❓ **Problem Statement**

In the market, there are existing popular language learning apps that are the go-to way for language enthusiasts or foreign workers to pick up a new language. However, the learning process often lacks personalization to the needs and learning style of individual learners and may have limited contextual practice with insufficient real-world conversational scenarios.

**Challenge**: Develop a generative AI solution that creates customized language exercises, dialogues, or quizzes based on a learner’s proficiency level, native language, and interests. The system should generate realistic conversational scenarios or cultural context to enhance immersion and retention.

---

## 🌐 **Live Demo**

🚀 Experience LinguaAI in action:  
[**http://gmah-env.eba-ppxf88e6.ap-southeast-5.elasticbeanstalk.com**](http://gmah-env.eba-ppxf88e6.ap-southeast-5.elasticbeanstalk.com)

---

## 🚀 **Hosting Locally**

Follow these steps to set up and run LinguaAI locally:

### ⚙️ **Prerequisites**
- [Node.js](https://nodejs.org/) (v14 or higher)  
- [Docker](https://www.docker.com/) (for local DynamoDB)

### 🛠️ **Setup**
1. **Install dependencies**:  
   ```bash
   npm install
   ```

2. **Start a local DynamoDB instance**:  
   ```bash
   docker run -p 8000:8000 amazon/dynamodb-local
   ```

3. **Set up the local DynamoDB table**:  
   ```bash
   node scripts/localTableManager.js
   ```
   > This will create all necessary tables in your local DynamoDB instance.

4. **Configure environment variables**:
   Create a `.env` file in the root directory based on the `.env.example` file and fill in your AWS credentials and Bedrock model ID.

5. **Start the development server**:  
   ```bash
   npm run dev
   ```
---

## 🌍 **Deployment Instructions**

To deploy LinguaAI:  
1. **Zip everything** except `node_modules` and `.env`.  
2. **Upload the zip file** to [AWS Elastic Beanstalk](https://ap-southeast-5.console.aws.amazon.com/elasticbeanstalk/home?region=ap-southeast-5#/environment/dashboard?environmentId=e-tyhth82n3m).

---

## 📝 **Notes**

- ⏳ If the generation takes too long or the generated content is not relevant to the topic, press `Ctrl + R` to reload the page in the **Grammar**, **Vocabulary**, or **Dialogue** tabs.
- 🛡️ LinguaAI is built entirely around **AWS services**, leveraging the scalability and reliability of the AWS ecosystem.
- 🤖 The app uses **AWS Bedrock's Amazon Nova Lite** for its AI-powered content generation capabilities.

---

## 🛠️ **Tech Stack**

LinguaAI is built using the following technologies:

| **Category**         | **Technology**                 |
| -------------------- | ------------------------------ |
| **Frontend**         | HTML, CSS, JavaScript          |
| **Backend**          | Node.js, Express.js            |
| **Database**         | AWS DynamoDB (local and cloud) |
| **AI Services**      | AWS Bedrock's Amazon Nova Lite |
| **Hosting**          | AWS Elastic Beanstalk          |
| **Containerization** | Docker                         |

---

## 💡 **About GMAH**

LinguaAI was developed as part of the [**GMAH Hackathon**](https://greataihackathon.com), showcasing the power of AI in revolutionizing language learning.

---
