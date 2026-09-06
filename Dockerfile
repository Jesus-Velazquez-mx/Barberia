# Se usan dos imágnes, una compila y construye la app, y la otra solo contiene el código ya compilado 
# y las dependencias de producción. Esto reduce el tamaño de la imagen final.

# Usamos una imagen base de Node.js
FROM node:24-alpine AS builder
# Creamos el nuevo directorio
WORKDIR /app/backend
# Copiamos el package e instalamos las dependencias
COPY backend/package*.json ./
RUN npm install
# Copiamos el código y construimos la app
COPY backend/ ./
RUN npm run build

# Creación de la imagen final
FROM node:24-alpine
# Instalamos curl para descargar el certificado de AWS RDS
RUN apk add --no-cache curl
# Creamos el directorio de la app
WORKDIR /app
# Copiamos el package e instalamos SOLO dependencias de producción
COPY backend/package*.json ./
RUN npm install --omit=dev
# Descargamos el certificado de AWS RDS
RUN curl -o ./global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
# Extraemos únicamente el código ya compilado de la primer imagen
COPY --from=builder /app/backend/dist ./dist
# Abrimos el puerto 3000
EXPOSE 3000

# Ejecutamos el servidor 
CMD ["npm", "start"]