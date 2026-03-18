FROM node:20-alpine

WORKDIR /app

# Instalar dependencias del sistema
RUN apk update && apk add --no-cache bash

# Copiar archivos de dependencias primero (mejor caching)
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código
COPY . .

# Construir la aplicación
RUN npm run build

# Exponer el puerto de la API
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]