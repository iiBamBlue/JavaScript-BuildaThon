import { AzureChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";

dotenv.config();

const agentThreads = {};

export class AgentService {
  constructor() {
    // Use your existing Azure OpenAI resource
    this.chatModel = new AzureChatOpenAI({
      azureOpenAIApiKey: process.env.AZURE_INFERENCE_SDK_KEY,
      azureOpenAIApiInstanceName: process.env.INSTANCE_NAME,
      azureOpenAIApiDeploymentName: process.env.DEPLOYMENT_NAME,
      azureOpenAIApiVersion: "2024-08-01-preview",
      temperature: 0.7,
      maxTokens: 4096,
    });

    // Agent personality - friendly with emojis like the README specifies
    this.systemPrompt = `You are a helpful agent who loves emojis 😊. Be friendly and concise in your responses. 
    You can help with general questions and provide helpful information.
    Always maintain a positive, helpful attitude with appropriate emojis.`;
  }

  async getOrCreateThread(sessionId) {
    if (!agentThreads[sessionId]) {
      // Create a simple thread structure
      agentThreads[sessionId] = {
        id: `thread_${sessionId}_${Date.now()}`,
        messages: [],
      };
    }
    return agentThreads[sessionId];
  }

  async processMessage(sessionId, message) {
    try {
      const thread = await this.getOrCreateThread(sessionId);

      // Build conversation history for this thread
      const messages = [
        { role: "system", content: this.systemPrompt },
        ...thread.messages,
        { role: "user", content: message },
      ];

      console.log(
        `Agent processing message in thread ${thread.id}: "${message}"`
      );

      const response = await this.chatModel.invoke(messages);

      // Save conversation to thread
      thread.messages.push(
        { role: "user", content: message },
        { role: "assistant", content: response.content }
      );

      // Keep thread history manageable (last 10 exchanges)
      if (thread.messages.length > 20) {
        thread.messages = thread.messages.slice(-20);
      }

      console.log(`Agent response: "${response.content}"`);

      return {
        reply: response.content,
      };
    } catch (error) {
      console.error("Agent service error:", error);
      return {
        reply:
          "Sorry, I encountered an error processing your request. Please try again! 😔",
      };
    }
  }
}
