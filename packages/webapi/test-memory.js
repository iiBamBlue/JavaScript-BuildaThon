// Test script to demonstrate memory functionality
console.log("Testing memory functionality...");

const sessionId = "demo-session-" + Date.now();

async function testConversation() {
  console.log("\n=== Testing Conversation Memory ===");
  console.log("Session ID:", sessionId);

  // First message - introduce name and ask about vacation
  console.log("\n1. First message: Introducing name and asking about vacation");
  const response1 = await fetch("http://localhost:3001/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message:
        "Hi, my name is Alice. Can you tell me about the vacation policies?",
      useRAG: true,
      sessionId: sessionId,
    }),
  });
  const data1 = await response1.json();
  console.log("AI Response:", data1.reply);

  // Second message - test memory recall
  console.log("\n2. Second message: Testing name recall");
  const response2 = await fetch("http://localhost:3001/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "What's my name?",
      useRAG: false,
      sessionId: sessionId,
    }),
  });
  const data2 = await response2.json();
  console.log("AI Response:", data2.reply);

  // Third message - test contextual follow-up
  console.log("\n3. Third message: Testing contextual follow-up");
  const response3 = await fetch("http://localhost:3001/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "How many vacation days would I get after 7 years?",
      useRAG: false,
      sessionId: sessionId,
    }),
  });
  const data3 = await response3.json();
  console.log("AI Response:", data3.reply);

  // Test session isolation
  console.log("\n=== Testing Session Isolation ===");
  const newSessionId = "demo-session-new-" + Date.now();
  console.log("New Session ID:", newSessionId);

  const response4 = await fetch("http://localhost:3001/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "What's my name?",
      useRAG: false,
      sessionId: newSessionId,
    }),
  });
  const data4 = await response4.json();
  console.log("AI Response (new session):", data4.reply);

  console.log("\n=== Memory Test Complete ===");
}

testConversation().catch(console.error);
