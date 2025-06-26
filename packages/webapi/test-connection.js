import dotenv from 'dotenv';
import { AzureChatOpenAI } from "@langchain/openai";

dotenv.config();

async function testAzureConnection() {
  console.log('Testing Azure OpenAI connection...');
  console.log('Endpoint:', `https://${process.env.INSTANCE_NAME}.openai.azure.com/`);
  console.log('Deployment:', process.env.DEPLOYMENT_NAME);
  
  try {
    const chatModel = new AzureChatOpenAI({
      azureOpenAIApiKey: process.env.AZURE_INFERENCE_SDK_KEY,
      azureOpenAIApiInstanceName: process.env.INSTANCE_NAME,
      azureOpenAIApiDeploymentName: process.env.DEPLOYMENT_NAME,
      azureOpenAIApiVersion: "2024-08-01-preview",
      temperature: 0.3,
      maxTokens: 100,
    });

    console.log('Sending test message...');
    const response = await chatModel.invoke([
      { role: "user", content: "Hello, can you respond with 'Connection successful!'?" }
    ]);
    
    console.log('✅ SUCCESS: Connection working!');
    console.log('Response:', response.content);
    
  } catch (error) {
    console.log('❌ ERROR: Connection failed');
    console.error('Error details:', error.message);
    
    if (error.message.includes('404')) {
      console.log('\n🔍 Troubleshooting suggestions:');
      console.log('1. Check if the resource name is correct:', process.env.INSTANCE_NAME);
      console.log('2. Check if the deployment name exists:', process.env.DEPLOYMENT_NAME);
      console.log('3. Verify the resource exists in Azure Portal');
      console.log('4. Ensure the resource is in the correct subscription');
    }
    
    if (error.message.includes('401') || error.message.includes('403')) {
      console.log('\n🔑 API Key issue:');
      console.log('1. Check if the API key is correct');
      console.log('2. Verify the key hasn\'t expired');
      console.log('3. Ensure the key has proper permissions');
    }
  }
}

testAzureConnection();
