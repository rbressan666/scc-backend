# Dockerfile (CORRIGIDO)
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências (usando npm install em vez de npm ci)
RUN npm install --only=production

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE 3000

# Definir variável de ambiente
ENV NODE_ENV=production

# Comando para iniciar a aplicação
CMD ["node", "server.js"]

