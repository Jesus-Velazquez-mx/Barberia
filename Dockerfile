# Compilar el backend (TypeScript -> dist/)
FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# Imagen a utilizar como base para el contenedor
FROM node:20-alpine

# Instalamos curl para poder descargar el certificado de AWS
RUN apk add --no-cache curl

# Creamos la carpeta de trabajo dentro del contenedor
WORKDIR /app

# Copiamos SOLO los archivos de configuración del backend
COPY backend/package*.json ./

# Instalamos las dependencias de Node.js
RUN npm install --omit=dev

# Descargamos el certificado de AWS RDS directo en la imagen
# (debe vivir en el cwd del proceso: connection.ts lo lee como './global-bundle.pem')
RUN curl -o ./global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# Copiamos el backend ya compilado
COPY --from=backend-builder /app/dist ./dist

# Exponemos el puerto en el que correrá el API de Express
EXPOSE 3000

# Comando para iniciar el servidor
CMD ["npm", "start"]