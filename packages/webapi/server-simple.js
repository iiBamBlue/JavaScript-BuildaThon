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
    "https://aistudioaiservices044508068113.openai.azure.com/openai/deployments/gpt-4o",
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

// Simple chat endpoint (without RAG for now)
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await client.chat.completions.create({
      messages: [{ role: "user", content: userMessage }],
      model: "gpt-4o",
      max_tokens: 4096,
      temperature: 0.7,
    });

    res.json({
      reply: response.choices[0].message.content,
      sources: [],
    });
  } catch (err) {
    console.error("Error in chat endpoint:", err);
    res.status(500).json({
      error: "Model call failed",
      message: err.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Chat endpoint: http://localhost:${PORT}/chat`);
});
