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

// Carregar configuração
let config;
try {
  const configData = fs.readFileSync('config.json', 'utf8');
  config = JSON.parse(configData);
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
  const emailContent = `
    <h2>Novo Lead Capturado - ${config.company.name}</h2>
    <h3>Dados do Cliente:</h3>
    <ul>
      <li><strong>Nome:</strong> ${userData.name || 'Não informado'}</li>
      <li><strong>Telefone:</strong> ${userData.phone || 'Não informado'}</li>
      <li><strong>E-mail:</strong> ${userData.email || 'Não informado'}</li>
      <li><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</li>
    </ul>
    
    <h3>Respostas do Formulário:</h3>
    ${Object.entries(userData)
      .filter(([key]) => !['name', 'phone', 'email'].includes(key))
      .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
      .join('')
    }
  `;

  const mailOptions = {
    from: config.smtp.user,
    to: config.admin.email,
    subject: `Novo Lead - ${userData.name || 'Lead sem nome'}`,
    html: emailContent
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('E-mail enviado com sucesso para:', config.admin.email);
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
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
  
  switch (currentStep.type) {
    case 'message':
      if (session.nextStep()) {
        // Se há próximo passo, processar automaticamente
        setTimeout(() => processCurrentStep(session), 1000);
      }
      return {
        type: 'message',
        text: currentStep.text,
        isBot: true
      };
      
    case 'input':
      session.awaitingInput = true;
      session.inputType = currentStep.input_type;
      return {
        type: 'message',
        text: currentStep.text,
        isBot: true,
        awaitingInput: true
      };
      
    case 'options':
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
  
  // Enviar mensagem de boas-vindas
  setTimeout(() => {
    const response = processCurrentStep(session);
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

// Rota de health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Rota para testar configuração de e-mail
app.post('/test-email', async (req, res) => {
  try {
    await transporter.verify();
    res.json({ success: true, message: 'Configuração de e-mail válida' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Widget disponível em: http://localhost:${PORT}/widget.js`);
});