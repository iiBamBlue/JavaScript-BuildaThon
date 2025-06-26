import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI client for Azure
const client = new OpenAI({
  baseURL:
    "https://aistudioaiservices044508068113.openai.azure.com/openai/deployments/gpt-4.1",
  apiKey: process.env.CUSTOM_OPENAI_API_KEY,
  defaultQuery: { "api-version": "2024-02-01" },
  defaultHeaders: {
    "api-key": process.env.CUSTOM_OPENAI_API_KEY,
  },
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Chat completion endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const response = await client.chat.completions.create({
      messages: messages,
      model: "gpt-4.1",
      max_tokens: 4096,
      temperature: 0.7,
    });

    res.json({
      message: response.choices[0].message.content,
      usage: response.usage,
    });
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

// Chat endpoint (simplified interface)
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await client.chat.completions.create({
      messages: [{ role: "user", content: message }],
      model: "gpt-4.1",
      max_tokens: 4096,
      temperature: 0.7,
    });

    res.json({
      reply: response.choices[0].message.content,
      usage: response.usage,
    });
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Chat endpoint: http://localhost:${PORT}/api/chat`);
  console.log(`Simple chat endpoint: http://localhost:${PORT}/chat`);
});
