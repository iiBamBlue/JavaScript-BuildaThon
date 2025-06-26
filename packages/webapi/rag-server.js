import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });

console.log("Environment check:");
console.log(
  "CUSTOM_OPENAI_API_KEY:",
  process.env.CUSTOM_OPENAI_API_KEY ? "✓ Loaded" : "✗ Missing"
);
console.log("Current working directory:", process.cwd());
console.log("Script directory:", __dirname);

const projectRoot = path.resolve(__dirname, "../..");
const textPath = path.join(projectRoot, "data/contoso-employee-handbook.txt");

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

// RAG functionality
let documentText = null;
let documentChunks = [];
const CHUNK_SIZE = 800;

async function loadDocument() {
  if (documentText) return documentText;

  console.log("Looking for text file at:", textPath);

  if (fs.existsSync(textPath)) {
    console.log("Loading text file...");
    documentText = fs.readFileSync(textPath, "utf-8");
  } else {
    console.log("No handbook file found");
    return "No handbook file found.";
  }

  console.log("Document loaded, length:", documentText.length);
  let currentChunk = "";
  const words = documentText.split(/\s+/);

  for (const word of words) {
    if ((currentChunk + " " + word).length <= CHUNK_SIZE) {
      currentChunk += (currentChunk ? " " : "") + word;
    } else {
      documentChunks.push(currentChunk);
      currentChunk = word;
    }
  }
  if (currentChunk) documentChunks.push(currentChunk);
  console.log("Document split into", documentChunks.length, "chunks");
  return documentText;
}

function retrieveRelevantContent(query) {
  console.log("Searching for query:", query);
  console.log("Available chunks:", documentChunks.length);

  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 3)
    .map((term) => term.replace(/[.,?!;:()"']/g, ""));

  console.log("Query terms:", queryTerms);

  if (queryTerms.length === 0) return [];

  const scoredChunks = documentChunks.map((chunk) => {
    const chunkLower = chunk.toLowerCase();
    let score = 0;
    for (const term of queryTerms) {
      const regex = new RegExp(term, "gi");
      const matches = chunkLower.match(regex);
      if (matches) score += matches.length;
    }
    return { chunk, score };
  });

  const relevantChunks = scoredChunks
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.chunk);

  console.log("Found", relevantChunks.length, "relevant chunks");
  return relevantChunks;
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Chat endpoint with RAG
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  const useRAG = req.body.useRAG === undefined ? true : req.body.useRAG;
  let messages = [];
  let sources = [];

  if (useRAG) {
    await loadDocument();
    sources = retrieveRelevantContent(userMessage);
    if (sources.length > 0) {
      messages.push({
        role: "system",
        content: `You are a helpful assistant answering questions about the company based on its employee handbook. 
        Use ONLY the following information from the handbook to answer the user's question.
        If you can't find relevant information in the provided context, say so clearly.
        --- EMPLOYEE HANDBOOK EXCERPTS ---
        ${sources.join("")}
        --- END OF EXCERPTS ---`,
      });
    } else {
      messages.push({
        role: "system",
        content:
          "You are a helpful assistant. No relevant information was found in the employee handbook for this question.",
      });
    }
  } else {
    messages.push({
      role: "system",
      content: "You are a helpful assistant.",
    });
  }

  messages.push({ role: "user", content: userMessage });

  try {
    const response = await client.chat.completions.create({
      messages: messages,
      model: "gpt-4.1",
      max_tokens: 4096,
      temperature: 1,
      top_p: 1,
    });

    res.json({
      reply: response.choices[0].message.content,
      sources: useRAG ? sources : [],
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
