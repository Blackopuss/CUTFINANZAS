<template>
  <div class="finance-chat-container">
    <!-- Chat Button -->
    <button class="chat-toggle-btn" @click="toggleChat">
      💬 IA
    </button>

    <!-- Chat Window -->
    <div v-if="isOpen" class="chat-window">
      <div class="chat-header">
        <h3>Asistente Financiero</h3>
        <button class="close-btn" @click="toggleChat">✖</button>
      </div>

      <div class="chat-messages" ref="messagesContainer">
        <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.role]">
          <div class="message-content" v-html="renderMarkdown(msg.content)"></div>
        </div>
        <div v-if="loading" class="message assistant">
          <div class="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>

      <div class="chat-suggestions" v-if="messages.length === 0">
        <button v-for="q in suggestions" :key="q" @click="sendMessage(q)">
          {{ q }}
        </button>
      </div>

      <div class="chat-input">
        <input 
          v-model="newMessage" 
          @keyup.enter="sendMessage(newMessage)" 
          placeholder="Pregunta sobre tus gastos..."
          :disabled="loading"
        />
        <button @click="sendMessage(newMessage)" :disabled="!newMessage.trim() || loading">
          ➤
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { marked } from 'marked';

export default {
  name: 'FinanceChat',
  data() {
    return {
      isOpen: false,
      newMessage: '',
      loading: false,
      messages: [],
      suggestions: [
        "¿En qué gasté más este mes?",
        "¿Cuánto llevo gastado en comida?",
        "¿Mis gastos aumentaron esta semana?",
        "¿Cuál es mi promedio de gasto diario?"
      ]
    }
  },
  methods: {
    toggleChat() {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.$nextTick(() => this.scrollToBottom());
      }
    },
    async sendMessage(text) {
      if (!text || !text.trim()) return;

      const userMsg = text;
      this.messages.push({ role: 'user', content: userMsg });
      this.newMessage = '';
      this.loading = true;
      this.$nextTick(() => this.scrollToBottom());

      try {
        const token = localStorage.getItem('token');
        const response = await axios.post('http://localhost:3000/api/chat-finance', {
          question: userMsg
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        this.messages.push({ role: 'assistant', content: response.data.reply });
      } catch (error) {
        console.error("Chat error:", error);
        this.messages.push({ 
          role: 'assistant', 
          content: "Lo siento, tuve un problema al procesar tu consulta. Por favor intenta de nuevo." 
        });
      } finally {
        this.loading = false;
        this.$nextTick(() => this.scrollToBottom());
      }
    },
    scrollToBottom() {
      const container = this.$refs.messagesContainer;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    },
    renderMarkdown(text) {
      return marked(text);
    }
  }
}
</script>

<style scoped>
.finance-chat-container {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
  font-family: 'Inter', sans-serif;
}

.chat-toggle-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    var(--color-btn) 0%,
    color-mix(in srgb, var(--color-btn), white 20%) 100%
  );
  color: white;
  border: none;
  font-size: 24px;
  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;

  transition: transform 0.2s, box-shadow 0.2s;
}

.chat-toggle-btn:hover {
  transform: scale(1.03);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}



.chat-window {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 350px;
  height: 500px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #eee;
}

.chat-header {
  background: #667eea;
  color: white;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header h3 {
  margin: 0;
  font-size: 16px;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 18px;
}

.chat-messages {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
  background: #f9f9f9;
}

.message {
  max-width: 80%;
  padding: 10px 15px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.4;
}

.message.user {
  align-self: flex-end;
  background: #667eea;
  color: white;
  border-bottom-right-radius: 2px;
}

.message.assistant {
  align-self: flex-start;
  background: white;
  color: #333;
  border: 1px solid #eee;
  border-bottom-left-radius: 2px;
}

.chat-suggestions {
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  background: #f9f9f9;
}

.chat-suggestions button {
  background: white;
  border: 1px solid #ddd;
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 12px;
  cursor: pointer;
  color: #555;
  transition: background 0.2s;
}

.chat-suggestions button:hover {
  background: #eee;
}

.chat-input {
  padding: 15px;
  background: white;
  border-top: 1px solid #eee;
  display: flex;
  gap: 10px;
}

.chat-input input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 20px;
  outline: none;
}

.chat-input button {
  background: #667eea;
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-input button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.typing-indicator span {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: #ccc;
  border-radius: 50%;
  margin: 0 2px;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
</style>
