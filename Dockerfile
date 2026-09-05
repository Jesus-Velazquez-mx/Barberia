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

# Instalamos todas las dependencias (incluidas las de desarrollo, necesarias para compilar TypeScript)
RUN npm install

# Creamos la carpeta config y descargamos el certificado de AWS RDS directo en la imagen
RUN mkdir -p config && \
    curl -o ./config/global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# Copiamos todo el código fuente del backend
COPY backend/ ./

# Compilamos TypeScript a JavaScript (carpeta dist/)
RUN npm run build

# Eliminamos las dependencias de desarrollo, ya no se necesitan en tiempo de ejecución
RUN npm prune --omit=dev

# Copiamos el frontend compilado de React
# Lo metemos en una carpeta "public" para que Express lo pueda mostrar
COPY --from=frontend-builder /app/frontend/dist ./public

# Exponemos el puerto en el que correrá el API de Express
EXPOSE 3000

# Comando para iniciar el servidor
CMD ["npm", "start"]