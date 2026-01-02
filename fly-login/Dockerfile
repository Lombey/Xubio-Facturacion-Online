# Dockerfile para Fly.io - Puppeteer + Stealth
# Basado en imagen Node con Chromium preinstalado

FROM ghcr.io/puppeteer/puppeteer:21.11.0

# Configurar directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 8080

# Comando para iniciar la aplicación
CMD ["node", "server.js"]
