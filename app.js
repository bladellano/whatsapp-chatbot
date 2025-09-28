// Carregar variáveis de ambiente primeiro
require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Carregar configuração (prioriza .env sobre config.json)
let config;
try {
  const configData = fs.readFileSync('config.json', 'utf8');
  config = JSON.parse(configData);
  
  // Sobrescrever com variáveis de ambiente se disponíveis
  if (process.env.COMPANY_NAME) {
    config.company.name = process.env.COMPANY_NAME.replace(/"/g, '');
  }
  if (process.env.COMPANY_LOGO) {
    config.company.logo = process.env.COMPANY_LOGO;
  }
  if (process.env.SMTP_HOST) {
    config.smtp.host = process.env.SMTP_HOST;
  }
  if (process.env.SMTP_PORT) {
    config.smtp.port = parseInt(process.env.SMTP_PORT);
  }
  if (process.env.SMTP_USER) {
    config.smtp.user = process.env.SMTP_USER;
  }
  if (process.env.SMTP_PASS) {
    config.smtp.password = process.env.SMTP_PASS;
  }
  if (process.env.ADMIN_EMAIL) {
    config.admin.email = process.env.ADMIN_EMAIL;
  }
  if (process.env.SMTP_FROM_EMAIL) {
    config.smtp.from_email = process.env.SMTP_FROM_EMAIL;
  }
  if (process.env.SMTP_FROM_NAME) {
    config.smtp.from_name = process.env.SMTP_FROM_NAME;
  }
  if (process.env.CHAT_TITLE) {
    config.chat.title = process.env.CHAT_TITLE;
  }
  if (process.env.CHAT_SUBTITLE) {
    config.chat.subtitle = process.env.CHAT_SUBTITLE;
  }
  if (process.env.CHAT_PLACEHOLDER) {
    config.chat.placeholder = process.env.CHAT_PLACEHOLDER;
  }
  if (process.env.CHAT_COLOR_PRIMARY) {
    config.chat.colors.primary = process.env.CHAT_COLOR_PRIMARY;
  }
  if (process.env.CHAT_COLOR_SECONDARY) {
    config.chat.colors.secondary = process.env.CHAT_COLOR_SECONDARY;
  }
  if (process.env.CHAT_COLOR_TEXT) {
    config.chat.colors.text = process.env.CHAT_COLOR_TEXT;
  }
  if (process.env.CHAT_COLOR_BACKGROUND) {
    config.chat.colors.background = process.env.CHAT_COLOR_BACKGROUND;
  }
  
  console.log('✅ Configuração carregada (config.json + .env)');
} catch (error) {
  console.error('Erro ao carregar config.json:', error);
  process.exit(1);
}

// Configurar nodemailer
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.password
  },
  // Configurações adicionais para Gmail
  tls: {
    rejectUnauthorized: false
  }
});

// Armazenamento de sessões de usuários
const userSessions = new Map();

class ChatSession {
  constructor(socketId) {
    this.socketId = socketId;
    this.currentStep = 0;
    this.userData = {};
    this.awaitingInput = false;
    this.inputType = null;
    this.waitingForUserResponse = false;
  }
  
  getCurrentMessage() {
    return config.conversation.steps[this.currentStep];
  }
  
  nextStep() {
    this.currentStep++;
    return this.currentStep < config.conversation.steps.length;
  }
  
  hasMoreSteps() {
    return this.currentStep < config.conversation.steps.length;
  }
}

// Função para enviar e-mail
async function sendLeadEmail(userData) {
  // Formatar dados adicionais de forma mais legível
  const additionalData = Object.entries(userData)
    .filter(([key]) => !['name', 'phone', 'email'].includes(key))
    .map(([key, value]) => {
      const fieldName = key === 'interesse' ? 'Interesse' : 
                       key === 'horario_contato' ? 'Melhor horário para contato' :
                       key === 'observacoes' ? 'Observações' :
                       key.charAt(0).toUpperCase() + key.slice(1);
      
      let fieldValue = value;
      if (key === 'horario_contato') {
        fieldValue = value === 'manha' ? 'Manhã (8h às 12h)' :
                    value === 'tarde' ? 'Tarde (13h às 18h)' :
                    value === 'noite' ? 'Noite (19h às 21h)' : value;
      }
      
      return `<li><strong>${fieldName}:</strong> ${fieldValue}</li>`;
    })
    .join('');

  const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #25D366; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .section { margin-bottom: 20px; }
        .data-list { background: #f9f9f9; padding: 15px; border-left: 4px solid #25D366; }
        ul { list-style: none; padding: 0; }
        li { padding: 5px 0; border-bottom: 1px solid #eee; }
        .highlight { color: #25D366; font-weight: bold; }
        .footer { background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>🎯 Novo Lead Capturado - ${config.company.name}</h2>
      </div>
      
      <div class="content">
        <div class="section">
          <h3>📋 Dados do Cliente:</h3>
          <div class="data-list">
            <ul>
              <li><strong>👤 Nome:</strong> <span class="highlight">${userData.name || 'Não informado'}</span></li>
              <li><strong>📱 Telefone:</strong> <span class="highlight">${userData.phone || 'Não informado'}</span></li>
              <li><strong>📧 E-mail:</strong> <span class="highlight">${userData.email || 'Não informado'}</span></li>
              <li><strong>🕐 Data/Hora:</strong> ${new Date().toLocaleString('pt-BR', { 
                timeZone: 'America/Sao_Paulo',
                year: 'numeric',
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}</li>
            </ul>
          </div>
        </div>
        
        ${additionalData ? `
        <div class="section">
          <h3>💬 Informações Adicionais:</h3>
          <div class="data-list">
            <ul>
              ${additionalData}
            </ul>
          </div>
        </div>
        ` : ''}
        
        <div class="section">
          <p><strong>⚡ Ação Recomendada:</strong> Entre em contato com o cliente o mais breve possível para não perder a oportunidade!</p>
        </div>
      </div>
      
      <div class="footer">
        <p>Este lead foi capturado através do widget de chat do site ${config.company.name}</p>
        <p>Sistema de Captura de Leads - WhatsApp Bot Widget</p>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"${config.smtp.from_name || config.company.name + ' - Leads'}" <${config.smtp.from_email || config.smtp.user}>`,
    to: config.admin.email,
    subject: `🎯 Novo Lead: ${userData.name || 'Cliente Interessado'} - ${userData.interesse || 'Contato'}`,
    html: emailContent,
    // Versão texto alternativa
    text: `
      Novo Lead Capturado - ${config.company.name}
      
      Nome: ${userData.name || 'Não informado'}
      Telefone: ${userData.phone || 'Não informado'}
      E-mail: ${userData.email || 'Não informado'}
      Data/Hora: ${new Date().toLocaleString('pt-BR')}
      
      ${Object.entries(userData)
        .filter(([key]) => !['name', 'phone', 'email'].includes(key))
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n      ')}
    `
  };

  try {
    console.log('Enviando email para:', config.admin.email);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ E-mail enviado com sucesso!');
    console.log('Message ID:', info.messageId);
    console.log('Para:', config.admin.email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail:', error);
    console.error('Detalhes do erro:', {
      code: error.code,
      command: error.command,
      response: error.response
    });
    return { success: false, error: error.message };
  }
}

// Função para processar mensagem do usuário
function processUserMessage(session, message) {
  const currentStep = session.getCurrentMessage();
  
  if (session.awaitingInput) {
    // Processar input do usuário
    switch (session.inputType) {
      case 'name':
        session.userData.name = message;
        break;
      case 'phone':
        session.userData.phone = message;
        break;
      case 'email':
        session.userData.email = message;
        break;
      case 'text':
        session.userData[currentStep.save_as] = message;
        break;
    }
    
    session.awaitingInput = false;
    session.inputType = null;
    session.waitingForUserResponse = false;
    
    // Avançar para próximo passo
    if (session.nextStep()) {
      return processCurrentStep(session);
    } else {
      // Finalizar conversa e enviar e-mail
      sendLeadEmail(session.userData);
      return {
        type: 'message',
        text: config.conversation.closing_message,
        isBot: true,
        finished: true
      };
    }
  }
  
  // Processar resposta de opções
  if (currentStep.type === 'options') {
    const selectedOption = currentStep.options.find(opt => 
      opt.value.toLowerCase() === message.toLowerCase() ||
      opt.text.toLowerCase() === message.toLowerCase()
    );
    
    if (selectedOption) {
      if (currentStep.save_as) {
        session.userData[currentStep.save_as] = selectedOption.value;
      }
      
      session.waitingForUserResponse = false;  // Limpar flag
      
      if (session.nextStep()) {
        return processCurrentStep(session);
      } else {
        sendLeadEmail(session.userData);
        return {
          type: 'message',
          text: config.conversation.closing_message,
          isBot: true,
          finished: true
        };
      }
    } else {
      return {
        type: 'message',
        text: 'Por favor, escolha uma das opções disponíveis.',
        isBot: true
      };
    }
  }
  
  return null;
}

// Função para processar passo atual
function processCurrentStep(session) {
  const currentStep = session.getCurrentMessage();
  console.log(`Processando passo ${session.currentStep} (${currentStep.type}) para usuário:`, session.socketId);
  
  switch (currentStep.type) {
    case 'message':
      const response = {
        type: 'message',
        text: currentStep.text,
        isBot: true
      };
      
      // Só avança automaticamente se não estiver esperando resposta do usuário
      if (!session.waitingForUserResponse && session.nextStep()) {
        setTimeout(() => {
          const nextResponse = processCurrentStep(session);
          if (nextResponse) {
            const socketId = session.socketId;
            const socket = [...io.sockets.sockets.values()].find(s => s.id === socketId);
            if (socket) {
              console.log('Auto-enviando próximo passo para:', socketId);
              socket.emit('bot-message', nextResponse);
            }
          }
        }, 1000);
      }
      
      return response;
      
    case 'input':
      session.awaitingInput = true;
      session.inputType = currentStep.input_type;
      session.waitingForUserResponse = true;
      return {
        type: 'message',
        text: currentStep.text,
        isBot: true,
        awaitingInput: true
      };
      
    case 'options':
      // Para opções, marcar que está esperando resposta do usuário
      session.waitingForUserResponse = true;
      console.log('Exibindo opções - aguardando resposta do usuário');
      return {
        type: 'options',
        text: currentStep.text,
        options: currentStep.options,
        isBot: true
      };
  }
}

// Socket.IO
io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.id);
  
  // Criar nova sessão
  const session = new ChatSession(socket.id);
  userSessions.set(socket.id, session);
  
  console.log('Configuração carregada:', config ? 'OK' : 'ERRO');
  console.log('Total de passos na conversa:', config?.conversation?.steps?.length || 0);
  
  // Enviar mensagem de boas-vindas
  setTimeout(() => {
    console.log('Processando primeiro passo para usuário:', socket.id);
    const response = processCurrentStep(session);
    console.log('Resposta do primeiro passo:', response);
    socket.emit('bot-message', response);
  }, 1000);
  
  // Receber mensagem do usuário
  socket.on('user-message', (message) => {
    const session = userSessions.get(socket.id);
    if (!session) return;
    
    const response = processUserMessage(session, message.text);
    if (response) {
      setTimeout(() => {
        socket.emit('bot-message', response);
      }, 500);
    }
  });
  
  // Desconexão
  socket.on('disconnect', () => {
    console.log('Usuário desconectado:', socket.id);
    userSessions.delete(socket.id);
  });
});

// Rota para servir o widget
app.get('/widget.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'widget.js'));
});

// Rota para servir página de teste
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test.html'));
});

// Rota para servir painel de administração
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-panel.html'));
});

// Rota para servir o sobre
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'about.html'));
});

// Rota para servir configurações do chat (para o widget)
app.get('/chat-config', (req, res) => {
  res.json({
    company: {
      name: config.company.name,
      logo: config.company.logo
    },
    chat: {
      title: config.chat.title,
      subtitle: config.chat.subtitle,
      placeholder: config.chat.placeholder,
      colors: config.chat.colors
    }
  });
});

// Rota para debug - mostra todas as configurações carregadas
app.get('/debug-config', (req, res) => {
  res.json({
    fromEnv: {
      COMPANY_NAME: process.env.COMPANY_NAME,
      COMPANY_LOGO: process.env.COMPANY_LOGO,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL,
      SMTP_FROM_NAME: process.env.SMTP_FROM_NAME,
      ADMIN_EMAIL: process.env.ADMIN_EMAIL,
      CHAT_TITLE: process.env.CHAT_TITLE,
      CHAT_SUBTITLE: process.env.CHAT_SUBTITLE,
      CHAT_COLOR_PRIMARY: process.env.CHAT_COLOR_PRIMARY
    },
    finalConfig: {
      company: config.company,
      smtp: {
        host: config.smtp.host,
        port: config.smtp.port,
        user: config.smtp.user,
        from_email: config.smtp.from_email,
        from_name: config.smtp.from_name
        // password: '***HIDDEN***'
      },
      admin: config.admin,
      chat: config.chat
    }
  });
});

// Rota de health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Rota para testar configuração de e-mail
app.post('/test-email', async (req, res) => {
  try {
    console.log('Testando configuração SMTP...');
    await transporter.verify();
    res.json({ success: true, message: 'Configuração de e-mail válida' });
  } catch (error) {
    console.error('Erro na verificação SMTP:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Rota para testar envio de email completo
app.post('/test-lead-email', async (req, res) => {
  try {
    console.log('Testando envio de email de lead...');
    
    // Dados de exemplo para teste
    const testUserData = {
      name: 'João da Silva (TESTE)',
      phone: '(11) 99999-9999',
      email: 'joao.teste@example.com',
      interesse: 'produtos',
      horario_contato: 'manha',
      observacoes: 'Este é um teste do sistema de envio de emails. Pode ignorar esta mensagem.'
    };
    
    const result = await sendLeadEmail(testUserData);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Email de teste enviado com sucesso!',
        messageId: result.messageId,
        sentTo: config.admin.email
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Falha ao enviar email de teste',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Erro no teste de email:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Widget disponível em: http://localhost:${PORT}/widget.js`);
});