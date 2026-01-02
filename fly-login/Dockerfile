# Dockerfile para Fly.io - Puppeteer + Stealth
# Basado en imagen Node con Chromium preinstalado

FROM ghcr.io/puppeteer/puppeteer:21.11.0

# Configurar directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json desde fly-login/
COPY fly-login/package*.json ./

# Instalar dependencias (ignorar scripts prepare/postinstall)
RUN npm ci --only=production --ignore-scripts

# Copiar código fuente desde fly-login/
COPY fly-login/ .

# Exponer puerto
EXPOSE 8080

# Comando para iniciar la aplicación
CMD ["node", "server.js"]
