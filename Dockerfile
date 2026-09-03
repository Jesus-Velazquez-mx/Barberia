# Construir el Frontend (React)
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
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

# Creamos la carpeta config y descargamos el certificado de AWS RDS directo en la imagen
RUN mkdir -p config && \
    curl -o ./config/global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# Copiamos todo el código fuente del backend
COPY backend/ ./

# Copiamos el frontend compilado de React
# Lo metemos en una carpeta "public" para que Express lo pueda mostrar
COPY --from=frontend-builder /app/frontend/dist ./public

# Exponemos el puerto en el que correrá el API de Express
EXPOSE 3000

# Comando para iniciar el servidor
CMD ["npm", "start"]