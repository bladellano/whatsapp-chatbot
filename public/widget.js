(function() {
  'use strict';
  
  // Configuração do widget
  const WIDGET_CONFIG = {
    serverUrl: 'http://localhost:3000', // Altere para sua URL de produção
    socketPath: '/socket.io/'
  };
  
  // Verificar se já existe widget
  if (document.getElementById('whatsapp-widget')) return;
  
  // CSS do widget
  const widgetCSS = `
    #whatsapp-widget {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    #whatsapp-chat-button {
      width: 60px;
      height: 60px;
      background: #25D366;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
      border: none;
      outline: none;
    }
    
    #whatsapp-chat-button:hover {
      background: #128C7E;
      transform: scale(1.1);
    }
    
    #whatsapp-chat-button svg {
      width: 30px;
      height: 30px;
      fill: white;
    }
    
    #whatsapp-chat-window {
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 350px;
      height: 500px;
      background: white;
      border-radius: 15px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.3);
      display: none;
      flex-direction: column;
      overflow: hidden;
      animation: slideUp 0.3s ease-out;
    }
    
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    @media (max-width: 480px) {
      #whatsapp-chat-window {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        border-radius: 0;
      }
    }
    
    .chat-header {
      background: #25D366;
      color: white;
      padding: 15px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .chat-header-info {
      display: flex;
      align-items: center;
      flex: 1;
    }
    
    .chat-header-avatar {
      width: 40px;
      height: 40px;
      background: #128C7E;
      border-radius: 50%;
      margin-right: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: bold;
    }
    
    .chat-header-text h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }
    
    .chat-header-text p {
      margin: 2px 0 0 0;
      font-size: 12px;
      opacity: 0.8;
    }
    
    .chat-close {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 5px;
      line-height: 1;
    }
    
    .chat-messages {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      background: #F0F0F0;
      background-image: 
        radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 2px, transparent 2px),
        radial-gradient(circle at 75% 75%, rgba(255,255,255,0.2) 2px, transparent 2px);
      background-size: 20px 20px;
    }
    
    .chat-message {
      margin-bottom: 15px;
      display: flex;
    }
    
    .chat-message.bot {
      justify-content: flex-start;
    }
    
    .chat-message.user {
      justify-content: flex-end;
    }
    
    .message-bubble {
      max-width: 80%;
      padding: 10px 15px;
      border-radius: 18px;
      font-size: 14px;
      line-height: 1.4;
      word-wrap: break-word;
    }
    
    .chat-message.bot .message-bubble {
      background: white;
      color: #333;
      border-bottom-left-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .chat-message.user .message-bubble {
      background: #DCF8C6;
      color: #333;
      border-bottom-right-radius: 5px;
    }
    
    .message-options {
      margin-top: 10px;
    }
    
    .option-button {
      display: block;
      width: 100%;
      margin: 5px 0;
      padding: 10px 15px;
      background: white;
      border: 2px solid #25D366;
      color: #25D366;
      border-radius: 20px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s ease;
      text-align: center;
    }
    
    .option-button:hover {
      background: #25D366;
      color: white;
    }
    
    .chat-input-container {
      padding: 15px 20px;
      background: white;
      border-top: 1px solid #E0E0E0;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .chat-input {
      flex: 1;
      border: 1px solid #E0E0E0;
      border-radius: 25px;
      padding: 12px 20px;
      font-size: 14px;
      outline: none;
      font-family: inherit;
    }
    
    .chat-input:focus {
      border-color: #25D366;
    }
    
    .chat-send-btn {
      width: 45px;
      height: 45px;
      background: #25D366;
      border: none;
      border-radius: 50%;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.3s ease;
    }
    
    .chat-send-btn:hover {
      background: #128C7E;
    }
    
    .chat-send-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    
    .typing-indicator {
      display: flex;
      align-items: center;
      padding: 10px 15px;
      margin-bottom: 15px;
    }
    
    .typing-dots {
      background: white;
      border-radius: 18px;
      border-bottom-left-radius: 5px;
      padding: 15px 20px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .typing-dots span {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #999;
      margin: 0 2px;
      animation: typing 1.4s infinite ease-in-out;
    }
    
    .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
    .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes typing {
      0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
      40% { opacity: 1; transform: scale(1); }
    }
    
    .connection-status {
      text-align: center;
      padding: 10px;
      font-size: 12px;
      color: #999;
      background: #f5f5f5;
      border-top: 1px solid #e0e0e0;
    }
  `;
  
  // Adicionar CSS ao documento
  const style = document.createElement('style');
  style.textContent = widgetCSS;
  document.head.appendChild(style);
  
  // HTML do widget
  const widgetHTML = `
    <div id="whatsapp-widget">
      <button id="whatsapp-chat-button" type="button">
        <svg viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.306"/>
        </svg>
      </button>
      
      <div id="whatsapp-chat-window">
        <div class="chat-header">
          <div class="chat-header-info">
            <div class="chat-header-avatar">ME</div>
            <div class="chat-header-text">
              <h3>Atendimento Online</h3>
              <p>Resposta rápida</p>
            </div>
          </div>
          <button class="chat-close" type="button">&times;</button>
        </div>
        
        <div class="chat-messages" id="chat-messages">
        </div>
        
        <div class="chat-input-container">
          <input type="text" id="chat-input" class="chat-input" placeholder="Digite sua mensagem..." maxlength="500">
          <button id="chat-send-btn" class="chat-send-btn" type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
        
        <div class="connection-status" id="connection-status">Conectando...</div>
      </div>
    </div>
  `;
  
  // Adicionar widget ao DOM
  document.body.insertAdjacentHTML('beforeend', widgetHTML);
  
  // Elementos do DOM
  const chatButton = document.getElementById('whatsapp-chat-button');
  const chatWindow = document.getElementById('whatsapp-chat-window');
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const chatSendBtn = document.getElementById('chat-send-btn');
  const chatClose = document.querySelector('.chat-close');
  const connectionStatus = document.getElementById('connection-status');
  
  // Variáveis de estado
  let isOpen = false;
  let socket = null;
  let isConnected = false;
  let messageId = 0;
  
  // Conectar ao servidor Socket.IO
  function connectSocket() {
    if (typeof io === 'undefined') {
      console.error('Socket.IO não carregado');
      connectionStatus.textContent = 'Erro: Socket.IO não encontrado';
      return;
    }
    
    socket = io(WIDGET_CONFIG.serverUrl, {
      path: WIDGET_CONFIG.socketPath,
      transports: ['websocket', 'polling']
    });
    
    socket.on('connect', () => {
      console.log('Conectado ao servidor');
      isConnected = true;
      connectionStatus.textContent = 'Online';
      connectionStatus.style.color = '#25D366';
    });
    
    socket.on('disconnect', () => {
      console.log('Desconectado do servidor');
      isConnected = false;
      connectionStatus.textContent = 'Desconectado - Tentando reconectar...';
      connectionStatus.style.color = '#999';
    });
    
    socket.on('bot-message', (message) => {
      showTypingIndicator();
      setTimeout(() => {
        hideTypingIndicator();
        addBotMessage(message);
      }, 1000);
    });
    
    socket.on('connect_error', (error) => {
      console.error('Erro de conexão:', error);
      connectionStatus.textContent = 'Erro de conexão';
      connectionStatus.style.color = '#f44336';
    });
  }
  
  // Carregar Socket.IO
  function loadSocketIO() {
    if (typeof io !== 'undefined') {
      connectSocket();
      return;
    }
    
    const script = document.createElement('script');
    script.src = WIDGET_CONFIG.serverUrl + '/socket.io/socket.io.js';
    script.onload = connectSocket;
    script.onerror = () => {
      console.error('Falha ao carregar Socket.IO');
      connectionStatus.textContent = 'Erro ao conectar';
      connectionStatus.style.color = '#f44336';
    };
    document.head.appendChild(script);
  }
  
  // Adicionar mensagem do bot
  function addBotMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message bot';
    messageElement.innerHTML = `
      <div class="message-bubble">
        ${message.text}
        ${message.options ? createOptionsHTML(message.options) : ''}
      </div>
    `;
    
    chatMessages.appendChild(messageElement);
    scrollToBottom();
    
    if (message.finished) {
      chatInput.disabled = true;
      chatSendBtn.disabled = true;
      chatInput.placeholder = 'Conversa finalizada';
    }
  }
  
  // Criar HTML das opções
  function createOptionsHTML(options) {
    const optionsHTML = options.map(option => 
      `<button class="option-button" onclick="selectOption('${option.value}', '${option.text}')">${option.text}</button>`
    ).join('');
    
    return `<div class="message-options">${optionsHTML}</div>`;
  }
  
  // Selecionar opção
  window.selectOption = function(value, text) {
    addUserMessage(text);
    sendMessage(value);
    
    // Desabilitar botões de opção
    const optionButtons = document.querySelectorAll('.option-button');
    optionButtons.forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    });
  };
  
  // Adicionar mensagem do usuário
  function addUserMessage(text) {
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message user';
    messageElement.innerHTML = `
      <div class="message-bubble">${text}</div>
    `;
    
    chatMessages.appendChild(messageElement);
    scrollToBottom();
  }
  
  // Mostrar indicador de digitação
  function showTypingIndicator() {
    const typingElement = document.createElement('div');
    typingElement.className = 'typing-indicator';
    typingElement.id = 'typing-indicator';
    typingElement.innerHTML = `
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
    
    chatMessages.appendChild(typingElement);
    scrollToBottom();
  }
  
  // Esconder indicador de digitação
  function hideTypingIndicator() {
    const typingElement = document.getElementById('typing-indicator');
    if (typingElement) {
      typingElement.remove();
    }
  }
  
  // Rolar para o final das mensagens
  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Enviar mensagem
  function sendMessage(text) {
    if (!isConnected || !socket) return;
    
    socket.emit('user-message', { text: text });
  }
  
  // Eventos
  chatButton.addEventListener('click', () => {
    if (!isOpen) {
      chatWindow.style.display = 'flex';
      isOpen = true;
      chatInput.focus();
      
      if (!socket) {
        loadSocketIO();
      }
    }
  });
  
  chatClose.addEventListener('click', () => {
    chatWindow.style.display = 'none';
    isOpen = false;
  });
  
  chatSendBtn.addEventListener('click', () => {
    const message = chatInput.value.trim();
    if (message && isConnected) {
      addUserMessage(message);
      sendMessage(message);
      chatInput.value = '';
      chatInput.focus();
    }
  });
  
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      chatSendBtn.click();
    }
  });
  
  // Fechar com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      chatClose.click();
    }
  });
  
  // Evitar que o widget interfira em outros elementos
  document.getElementById('whatsapp-widget').addEventListener('click', (e) => {
    e.stopPropagation();
  });
  
})();