import fetch from 'node-fetch';

async function testChatEndpoint() {
  try {
    console.log('Testing /chat endpoint...');
    
    const response = await fetch('http://localhost:3001/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello, this is a test',
        useAgent: true,
        sessionId: 'test-404'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response statusText:', response.statusText);
    
    if (response.status === 404) {
      console.log('❌ 404 ERROR: Endpoint not found');
      const text = await response.text();
      console.log('Response body:', text);
    } else {
      const data = await response.json();
      console.log('✅ SUCCESS: Chat endpoint working');
      console.log('Response:', data);
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

testChatEndpoint();
