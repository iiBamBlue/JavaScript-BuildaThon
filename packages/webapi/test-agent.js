// Test the integrated agent service via HTTP
import fetch from "node-fetch";

async function testAgent() {
  try {
    console.log("Testing agent mode...");

    const response = await fetch("http://localhost:3001/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Hello! Tell me a joke with emojis",
        useAgent: true,
        sessionId: "test-session",
      }),
    });

    const data = await response.json();
    console.log("Agent response:", data);

    // Test follow-up message to check memory
    console.log("\nTesting conversation memory...");
    const response2 = await fetch("http://localhost:3001/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Can you tell me another one?",
        useAgent: true,
        sessionId: "test-session",
      }),
    });

    const data2 = await response2.json();
    console.log("Follow-up response:", data2);
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testAgent();
