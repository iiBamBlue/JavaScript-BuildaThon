import { LitElement, html } from "lit";
import {
  loadMessages,
  saveMessages,
  clearMessages,
} from "../utils/chatStore.js";
import "./chat.css"; // Import the CSS file

export class ChatInterface extends LitElement {
  static get properties() {
    return {
      messages: { type: Array },
      inputMessage: { type: String },
      isLoading: { type: Boolean },
      isRetrieving: { type: Boolean },
      ragEnabled: { type: Boolean },
      agentEnabled: { type: Boolean },
    };
  }

  constructor() {
    super();
    // Initialize component state
    this.messages = [];
    this.inputMessage = "";
    this.isLoading = false;
    this.isRetrieving = false;
    this.ragEnabled = true; // Enable by default
    this.agentEnabled = true; // Enable agent mode by default per README

    // Generate or load session ID
    this.sessionId = this._getOrCreateSessionId();
  }

  // Render into light DOM so external CSS applies
  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    // Load chat history from localStorage when component is added to the DOM
    this.messages = loadMessages();
  }

  updated(changedProps) {
    // Save chat history to localStorage whenever messages change
    if (changedProps.has("messages")) {
      saveMessages(this.messages);
    }
  }

  render() {
    // Render the chat UI: header, messages, and input area
    return html`
      <div class="chat-container">
        <div class="chat-header">
          <button class="clear-cache-btn" @click=${this._clearCache}>
            🧹Clear Chat
          </button>
          <label class="agent-toggle">
            <input
              type="checkbox"
              ?checked=${this.agentEnabled}
              @change=${this._toggleAgent} />
            Agent Mode 🤖
          </label>
          <label class="rag-toggle">
            <input
              type="checkbox"
              ?checked=${this.ragEnabled}
              @change=${this._toggleRag}
              ?disabled=${this.agentEnabled} />
            Use Employee Handbook
          </label>
        </div>
        <div class="chat-messages">
          ${this.messages.map(
            (message) => html`
              <div
                class="message ${message.role === "user"
                  ? "user-message"
                  : "ai-message"}">
                <div class="message-content">
                  <span class="message-sender"
                    >${message.role === "user"
                      ? "You"
                      : this.agentEnabled
                      ? "Agent 🤖"
                      : "AI"}</span
                  >
                  <p>${message.content}</p>
                  ${this.ragEnabled &&
                  message.sources &&
                  message.sources.length > 0
                    ? html`
                        <details class="sources">
                          <summary>📚 Sources</summary>
                          <div class="sources-content">
                            ${message.sources.map(
                              (source) => html`<p>${source}</p>`
                            )}
                          </div>
                        </details>
                      `
                    : ""}
                </div>
              </div>
            `
          )}
          ${this.isRetrieving
            ? html`
                <div class="message system-message">
                  <p>
                    ${this.agentEnabled
                      ? "🤖 Agent is thinking..."
                      : "📚 Searching employee handbook..."}
                  </p>
                </div>
              `
            : ""}
          ${this.isLoading && !this.isRetrieving
            ? html`
                <div class="message ai-message">
                  <div class="message-content">
                    <span class="message-sender"
                      >${this.agentEnabled ? "Agent 🤖" : "AI"}</span
                    >
                    <p>
                      ${this.agentEnabled
                        ? "Agent is processing..."
                        : "Thinking..."}
                    </p>
                  </div>
                </div>
              `
            : ""}
        </div>
        <div class="chat-input">
          <input
            type="text"
            placeholder="${this.agentEnabled
              ? "Chat with your helpful AI agent! 😊"
              : "Ask about company policies, benefits, etc..."}"
            .value=${this.inputMessage}
            @input=${this._handleInput}
            @keyup=${this._handleKeyUp} />
          <button
            @click=${this._sendMessage}
            ?disabled=${this.isLoading || !this.inputMessage.trim()}>
            Send
          </button>
        </div>
      </div>
    `;
  }

  // Clear chat history from localStorage and UI
  _clearCache() {
    clearMessages();
    this.messages = [];
    // Generate new session ID when clearing chat
    this.sessionId = this._generateSessionId();
    localStorage.setItem("chat-session-id", this.sessionId);
  }

  // Generate or retrieve session ID
  _getOrCreateSessionId() {
    let sessionId = localStorage.getItem("chat-session-id");
    if (!sessionId) {
      sessionId = this._generateSessionId();
      localStorage.setItem("chat-session-id", sessionId);
    }
    return sessionId;
  }

  // Generate a unique session ID
  _generateSessionId() {
    return (
      "session-" + Math.random().toString(36).substr(2, 9) + "-" + Date.now()
    );
  }

  // Handle Agent toggle change
  _toggleAgent(e) {
    this.agentEnabled = e.target.checked;
    // When agent mode is enabled, show retrieving for all messages
    // When disabled, RAG mode controls the retrieving indicator
  }

  // Handle RAG toggle change
  _toggleRag(e) {
    this.ragEnabled = e.target.checked;
  }

  // Update inputMessage state as the user types
  _handleInput(e) {
    this.inputMessage = e.target.value;
  }

  // Send message on Enter key if not loading
  _handleKeyUp(e) {
    if (e.key === "Enter" && this.inputMessage.trim() && !this.isLoading) {
      this._sendMessage();
    }
  }

  // Handle sending a message and receiving a response
  async _sendMessage() {
    if (!this.inputMessage.trim() || this.isLoading) return;

    // Add user's message to the chat
    const userMessage = {
      role: "user",
      content: this.inputMessage,
    };

    this.messages = [...this.messages, userMessage];
    const userQuery = this.inputMessage;
    this.inputMessage = "";

    // Show retrieving status if RAG is enabled or agent mode is on
    if (this.ragEnabled || this.agentEnabled) {
      this.isRetrieving = true;
    }
    this.isLoading = true;

    try {
      // Call the real AI API
      const aiResponse = await this._apiCall(userQuery);

      // Add AI's response to the chat with sources
      this.messages = [
        ...this.messages,
        {
          role: "assistant",
          content: aiResponse.reply || aiResponse,
          sources: aiResponse.sources || [],
        },
      ];
    } catch (error) {
      // Handle errors gracefully
      console.error("Error calling model:", error);
      this.messages = [
        ...this.messages,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          sources: [],
        },
      ];
    } finally {
      this.isLoading = false;
      this.isRetrieving = false;
    }
  }

  // Call the real AI API
  async _apiCall(message) {
    const res = await fetch("http://localhost:3001/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        useRAG: this.ragEnabled && !this.agentEnabled, // Don't use RAG when agent is enabled
        useAgent: this.agentEnabled,
        sessionId: this.sessionId,
      }),
    });
    const data = await res.json();
    return data;
  }
}

customElements.define("chat-interface", ChatInterface);
