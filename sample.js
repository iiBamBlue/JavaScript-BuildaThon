const ModelClient = require("@azure-rest/ai-inference").default;
const { AzureKeyCredential } = require("@azure/core-auth");
const fs = require("fs");

// You need to set your GITHUB_TOKEN environment variable
const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.inference.ai.azure.com";
const modelName = "gpt-4o-mini"; // Multimodal model that supports vision

async function main() {
  const client = ModelClient(endpoint, new AzureKeyCredential(token));

  // Read and encode the image
  const imageBuffer = fs.readFileSync("contoso_layout_sketch.jpg");
  const imageBase64 = imageBuffer.toString("base64");

  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        {
          role: "system",
          content:
            "You are a helpful web developer assistant that can analyze images and generate HTML and CSS code.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Write HTML and CSS code for a web page based on the following hand-drawn sketch",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      model: modelName,
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 1.0,
    },
  });

  if (response.status !== "200") {
    throw response.body.error;
  }
  console.log(response.body.choices[0].message.content);
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});
