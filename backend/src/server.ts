import express, { type Request, type Response } from 'express';
import type { Pool } from 'pg';
import connection from './connection/connection.js';
import router from './routes/routes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import cors from 'cors';
import { sendFail } from './utils/apiResponse.js';
import { loadConfig } from './config/globalConfig.js';

loadConfig();
const { connectDB } = connection;

const app = express();
const port = 3000;

/* Configuración de Swagger para la documentación de la API con Swagger J*/
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Barbería',
            version: '1.0.0',
            description: 'Documentación de la API de la Barbería',
        },
    },
    apis: ['./src/routes/*.ts', './dist/routes/*.js'], // Ruta al archivo donde se encuentran las rutas de la API
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/* Pool de conexiones */
let pool: Pool | undefined;
/* Permitir solicitudes desde el dominio específico del front */

const allowedOrigin = process.env.ENV === 'local'
    ? 'http://localhost:5173'
    : 'https://barberia.erickdh.com';

app.use(
    cors({
        origin: allowedOrigin,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    })
);

/* Retornar JSON en las respuestas */
app.use(express.json());
/* Usar las rutas definidas en router */
app.use('/api', router);

// Respuesta con error al no encontrar la ruta especificada
app.use('/api', (req: Request, res: Response) => {
    sendFail({ res, message: 'Ruta de la API no encontrada.', status: 404 });
});

app.listen(port, async () => {
    console.log(`La app está escuchando en el puerto ${port}`);
    try {
        pool = await connectDB();
        console.log('Base de datos conectada');
    } catch (error) {
        console.log(`Deteniendo el servidor por fallo en BD. ERROR: ${error}`);
    }
});
