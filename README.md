# 🚀 Chat Bot Widget - WhatsApp Style

Sistema completo de chat bot para captura de leads em landing pages com aparência idêntica ao WhatsApp. Desenvolvido em Node.js com Socket.IO para comunicação em tempo real.

![Demo](https://img.shields.io/badge/Demo-Disponível-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7+-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Principais Recursos

- **🎨 Interface WhatsApp**: Design idêntico ao WhatsApp com animações suaves
- **⚙️ 100% Configurável**: Personalize mensagens, cores e fluxo via JSON
- **📧 Envio Automático**: Leads enviados automaticamente por e-mail
- **📱 Totalmente Responsivo**: Funciona em desktop, tablet e mobile
- **🚀 Fácil Integração**: Apenas 2 linhas de código para implementar
- **🔒 Seguro**: Validação de dados e proteção contra spam

## 📋 Demonstração

Veja o sistema funcionando: [Demo Online](demo.html)

## 🛠️ Tecnologias Utilizadas

- **Backend**: Node.js, Express, Socket.IO
- **Frontend**: HTML5, CSS3, JavaScript puro
- **E-mail**: Nodemailer
- **Outras**: CORS, Docker (opcional)

## 📦 Estrutura do Projeto

```
whatsapp-chatbot/
├── app.js                 # Servidor Node.js principal
├── config.json           # Configurações do sistema
├── package.json          # Dependências do projeto
├── Dockerfile            # Configuração Docker
├── docker-compose.yml    # Orquestração Docker
├── public/
│   └── widget.js         # Widget frontend
├── logs/                 # Logs da aplicação
└── README.md            # Documentação
```

## ⚡ Instalação Rápida

### 1. **Clone ou baixe os arquivos**
```bash
mkdir whatsapp-chatbot
cd whatsapp-chatbot
```

### 2. **Instale as dependências**
```bash
npm install
```

### 3. **Configure o sistema**
Edite o `config.json` com suas informações:

```json
{
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 587,
    "user": "seuemail@gmail.com",
    "password": "suasenhaapp"
  },
  "admin": {
    "email": "admin@minhaempresa.com"
  }
}
```

### 4. **Execute o servidor**
```bash
npm start
```

### 5. **Integre no seu site**
Adicione antes do `</body>`:

```html
<script src="https://seuservidor.com/socket.io/socket.io.js"></script>
<script src="https://seuservidor.com/widget.js"></script>
```

## ⚙️ Configuração Detalhada

### 📧 Configuração SMTP

#### Gmail
1. Ative a verificação em 2 etapas
2. Gere uma senha de app
3. Use no `config.json`:

```json
{
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 587,
    "user": "seuemail@gmail.com",
    "password": "senha-app-gerada"
  }
}
```

#### Outros Provedores
- **Outlook**: `smtp.live.com`, porta 587
- **Yahoo**: `smtp.mail.yahoo.com`, porta 587
- **SendGrid**: `smtp.sendgrid.net`, porta 587

### 🎨 Personalização Visual

```json
{
  "company": {
    "name": "Sua Empresa",
    "logo": "https://seusite.com/logo.png"
  },
  "chat": {
    "title": "Atendimento Online",
    "subtitle": "Resposta rápida",
    "placeholder": "Digite sua mensagem...",
    "colors": {
      "primary": "#25D366",
      "secondary": "#128C7E",
      "text": "#FFFFFF",
      "background": "#F0F0F0"
    }
  }
}
```

### 💬 Configuração do Fluxo

Defina o fluxo de conversa editando `conversation.steps` no `config.json`:

```json
{
  "conversation": {
    "steps": [
      {
        "type": "message",
        "text": "Olá! 👋 Como posso te ajudar?"
      },
      {
        "type": "options",
        "text": "Escolha uma opção:",
        "options": [
          {"text": "Produtos", "value": "produtos"},
          {"text": "Suporte", "value": "suporte"},
          {"text": "Orçamento", "value": "orcamento"}
        ],
        "save_as": "interesse"
      },
      {
        "type": "input",
        "text": "Qual é o seu nome?",
        "input_type": "name"
      },
      {
        "type": "input",
        "text": "Qual é o seu telefone?",
        "input_type": "phone"
      },
      {
        "type": "input",
        "text": "Qual é o seu e-mail?",
        "input_type": "email"
      }
    ],
    "closing_message": "Obrigado! Nossa equipe entrará em contato."
  }
}
```

#### Tipos de Mensagem

| Tipo | Descrição | Parâmetros |
|------|-----------|------------|
| `message` | Mensagem simples do bot | `text` |
| `input` | Solicita entrada do usuário | `text`, `input_type` |
| `options` | Oferece opções para escolha | `text`, `options`, `save_as` |

#### Tipos de Input

| Tipo | Validação | Exemplo |
|------|-----------|---------|
| `name` | Nome do usuário | João Silva |
| `phone` | Telefone com DDD | (11) 99999-9999 |
| `email` | E-mail válido | joao@email.com |
| `text` | Texto livre | Qualquer texto |

## 🐳 Deploy com Docker

### Usando Docker Compose (Recomendado)

```bash
# Clonar arquivos
git clone seu-repositorio
cd whatsapp-chatbot

# Configurar
cp config.json.example config.json
# Editar config.json com suas informações

# Executar
docker-compose up -d
```

### Usando Docker simples

```bash
# Build da imagem
docker build -t whatsapp-chatbot .

# Executar container
docker run -d \
  --name chatbot-widget \
  -p 3000:3000 \
  -v $(pwd)/config.json:/app/config.json:ro \
  whatsapp-chatbot
```

## 🌐 Deploy em Produção

### 1. **VPS/Servidor dedicado**

```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clonar projeto
git clone seu-repositorio
cd whatsapp-chatbot
npm install

# Instalar PM2
npm install -g pm2

# Iniciar aplicação
pm2 start app.js --name "chatbot-widget"
pm2 startup
pm2 save
```

### 2. **Heroku**

```bash
# Instalar Heroku CLI
# Criar app
heroku create seu-app-name

# Configurar variáveis
heroku config:set NODE_ENV=production
heroku config:set SMTP_HOST=smtp.gmail.com
heroku config:set SMTP_PORT=587
heroku config:set SMTP_USER=seuemail@gmail.com
heroku config:set SMTP_PASS=suasenha

# Deploy
git push heroku main
```

### 3. **Vercel/Netlify**

Para plataformas serverless, adapte o código para usar functions:

```javascript
// api/chat.js (Vercel)
module.exports = (req, res) => {
  // Lógica do chat aqui
};
```

## 🔧 Configuração Nginx

```nginx
server {
    listen 80;
    server_name seudominio.com;
    
    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seudominio.com;
    
    # Certificados SSL
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # Headers de segurança
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Socket.IO específico
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 Monitoramento e Analytics

### 1. **Logs do Sistema**

```javascript
// Adicionar ao app.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Usar nos eventos
socket.on('user-message', (message) => {
  logger.info('Mensagem recebida', { 
    socketId: socket.id, 
    message: message.text,
    timestamp: new Date()
  });
});
```

### 2. **Métricas de Performance**

```javascript
// Middleware de métricas
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});
```

### 3. **Health Check**

```javascript
// Adicionar ao app.js
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    connections: io.engine.clientsCount
  });
});
```

## 🔒 Segurança

### 1. **Rate Limiting**

```javascript
const rateLimit = require('express-rate-limit');

// Rate limiting geral
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: 'Muitas tentativas, tente novamente em 15 minutos'
});

// Rate limiting para Socket.IO
const socketLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // máximo 30 mensagens por minuto
  skip: (req) => false
});

app.use(generalLimiter);
```

### 2. **Validação de Dados**

```javascript
const validator = require('validator');

function validateUserInput(input, type) {
  switch(type) {
    case 'email':
      return validator.isEmail(input);
    case 'phone':
      return validator.isMobilePhone(input, 'pt-BR');
    case 'name':
      return input.length >= 2 && input.length <= 50;
    case 'text':
      return input.length <= 500;
    default:
      return false;
  }
}
```

### 3. **Sanitização**

```javascript
const xss = require('xss');

function sanitizeInput(input) {
  return xss(input, {
    whiteList: {}, // Remove todas as tags HTML
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script']
  });
}
```

## 🧪 Testes

### 1. **Teste da Configuração**

```bash
# Testar configuração de e-mail
curl -X POST http://localhost:3000/test-email

# Verificar status do servidor
curl http://localhost:3000/health
```

### 2. **Teste de Carga**

```javascript
// test/load-test.js
const io = require('socket.io-client');

const connections = [];
const numConnections = 100;

for (let i = 0; i < numConnections; i++) {
  const socket = io('http://localhost:3000');
  connections.push(socket);
  
  socket.on('connect', () => {
    console.log(`Conectado: ${i + 1}/${numConnections}`);
  });
}
```

## 🐛 Solução de Problemas

### **Widget não aparece**

1. Verificar se o Socket.IO foi carregado
2. Confirmar URL do servidor no widget
3. Verificar console do navegador para erros
4. Testar conexão direta: `http://seuservidor:3000`

### **E-mails não enviados**

1. Verificar credenciais SMTP no `config.json`
2. Testar endpoint: `curl -X POST http://localhost:3000/test-email`
3. Verificar logs do servidor
4. Confirmar configurações do provedor de e-mail

### **Erro de conexão Socket.IO**

1. Verificar CORS no servidor
2. Confirmar porta aberta (3000)
3. Testar WebSocket: `wscat -c ws://localhost:3000/socket.io/?EIO=4&transport=websocket`

### **Performance lenta**

1. Implementar cache Redis
2. Otimizar consultas de banco (se usar)
3. Configurar CDN para assets estáticos
4. Usar load balancer para múltiplas instâncias

## 🔄 Atualizações e Manutenção

### **Backup da Configuração**

```bash
# Backup automático do config.json
cp config.json config.json.backup.$(date +%Y%m%d_%H%M%S)
```

### **Atualização do Sistema**

```bash
# Backup
pm2 dump

# Atualizar dependências
npm update

# Reiniciar aplicação
pm2 restart chatbot-widget

# Verificar status
pm2 status
pm2 logs chatbot-widget
```

### **Monitoramento de Logs**

```bash
# Logs em tempo real
pm2 logs chatbot-widget --lines 100

# Logs de erro
tail -f logs/error.log

# Análise de logs
grep "ERROR" logs/combined.log | tail -20
```

## 📈 Análise de Conversão

### **Métricas Importantes**

- Taxa de conversão: Leads capturados / Conversas iniciadas
- Tempo médio de conversa
- Horários de maior atividade
- Tipos de interesse mais comuns
- Taxa de abandono por etapa

### **Implementar Tracking**

```javascript
// Adicionar ao app.js
const analytics = {
  conversationsStarted: 0,
  leadsConverted: 0,
  averageSessionTime: 0,
  popularInterests: {}
};

// Tracking de eventos
socket.on('conversation-start', () => {
  analytics.conversationsStarted++;
});

socket.on('lead-converted', (userData) => {
  analytics.leadsConverted++;
  if (userData.interesse) {
    analytics.popularInterests[userData.interesse] = 
      (analytics.popularInterests[userData.interesse] || 0) + 1;
  }
});
```

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## ⭐ Créditos

Desenvolvido com ❤️ para facilitar a captura de leads em landing pages.

## 📞 Suporte

Para suporte e dúvidas:

- 📧 E-mail: suporte@seudominio.com
- 💬 Issue no GitHub: [Criar Issue](https://github.com/seu-usuario/whatsapp-chatbot/issues)
- 📖 Wiki: [Ver Documentação](https://github.com/seu-usuario/whatsapp-chatbot/wiki)

---

**⚡ Transforme visitantes em leads com este sistema profissional de chat bot!**