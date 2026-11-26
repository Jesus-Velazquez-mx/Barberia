import express, { type Request, type Response } from 'express';
import type { Pool } from 'pg';
import connection from './connection/connection.js';
import router from './routes/routes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import cors from 'cors';
import { sendFail } from './utils/apiResponse.js';
import globalConfig from './config/globalConfig.js';
import { initTelegramBot, stopTelegramBot } from './services/telegramBotService.js';
import { createAppJobRunner } from './jobs/index.js';
import type { JobRunner } from './jobs/jobRunner.js';

const { connectDB, closeDB } = connection;

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
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Token JWT obtenido en /api/auth/login o /api/auth/register',
                },
            },
        },
        tags: [
            { name: 'Auth', description: 'Registro e inicio de sesión de usuarios' },
            { name: 'Users', description: 'Datos generales de los usuarios, comunes a todos los roles' },
            { name: 'Managers', description: 'Atributos específicos de los managers' },
            { name: 'Barbers', description: 'Atributos específicos de los barberos' },
            { name: 'Receptionists', description: 'Gestión de los recepcionistas por el gerente de su sucursal' },
            { name: 'Recommendation', description: 'Conexión con el microservicio de recomendación de IA' },
            { name: 'Reports', description: 'Reportes de desempeño para los gerentes' },
            { name: 'Test', description: 'Endpoints de prueba usados durante el desarrollo' },
        ],
    },
    apis: [import.meta.url.endsWith('.ts') ? './src/routes/*.ts' : './dist/routes/*.js'],
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/* Pool de conexiones */
let _pool: Pool | undefined;
/* Permitir solicitudes desde el dominio específico del front */

const allowedOrigin = globalConfig.FRONTEND_URL;

app.use(
    cors({
        origin: allowedOrigin,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    })
);

/* Retornar JSON en las respuestas */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
/* Usar las rutas definidas en router */
app.use('/api', router);

// Respuesta con error al no encontrar la ruta especificada
app.use('/api', (req: Request, res: Response) => {
    sendFail({ res, message: 'Ruta de la API no encontrada.', status: 404 });
});

/* Runner de jobs periódicos (src/jobs); se crea solo tras conectar la BD */
let jobRunner: JobRunner | undefined;

const server = app.listen(port, async () => {
    console.log(`La app está escuchando en el puerto ${port}`);
    /* Iniciar la instancia del bot */
    initTelegramBot();
    try {
        _pool = await connectDB();
        console.log('Base de datos conectada');
    } catch (error) {
        console.log(`Deteniendo el servidor por fallo en BD. ERROR: ${error}`);
        return;
    }

    /* Iniciar los jobs periódicos (recordatorios, transiciones de estado de citas) */
    if (globalConfig.JOBS_ENABLED) {
        jobRunner = createAppJobRunner(globalConfig);
        jobRunner.start();
    } else {
        console.log('[jobs] Jobs periódicos deshabilitados (JOBS_ENABLED=false)');
    }
});

/* Apagado ordenado: Docker envía SIGTERM al reiniciar/desplegar el contenedor */
let shuttingDown = false;
const shutdown = async (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Recibido ${signal}, apagando el servidor...`);
    try {
        await jobRunner?.stop();
        await stopTelegramBot();
        await new Promise<void>((resolve) => server.close(() => resolve()));
        await closeDB();
        process.exit(0);
    } catch (error) {
        console.error('Error durante el apagado del servidor:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
