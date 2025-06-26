const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const client = new OpenAI({
  baseURL:
    "https://aistudioaiservices044508068113.openai.azure.com/openai/deployments/gpt-4.1",
  apiKey: process.env.CUSTOM_OPENAI_API_KEY,
  defaultQuery: { "api-version": "2024-02-01" },
  defaultHeaders: {
    "api-key": process.env.CUSTOM_OPENAI_API_KEY,
  },
});

async function main() {
  const response = await client.chat.completions.create({
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "What is the capital of France?",
          },
        ],
      },
    ],
    model: "gpt-4.1",
    max_tokens: 4096,
  });

  console.log(response.choices[0].message.content);
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});
