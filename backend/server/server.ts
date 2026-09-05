import express from 'express';
import type { Pool } from 'pg';
import connection from '../connection/connection.js';
import router from '../routes/routes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import cors from 'cors';
import path from 'path';


const { connectDB } = connection;

const app = express()
const port = 3000

/* Configuración de Swagger para la documentación de la API con Swagger J*/
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Órdenes',
            version: '1.0.0',
            description: 'Documentación de la API de órdenes'
        }
    },
    apis: ['./routes/routes.{ts,js}'] // Ruta al archivo donde se encuentran las rutas de la API (.ts en dev, .js compilado en producción)
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/* Pool de conexiones */
let pool: Pool | undefined;
/* Permitir solicitudes desde cualquier origen (CORS) */
app.use(cors());
/* Retornar JSON en las respuestas */
app.use(express.json());
/* Usar las rutas definidas en router */
app.use('/api', router);
/* Buscamos el dist */
const distPath = path.join(process.cwd(), 'public');
/* Decimos a express que sirva en la carpeta 'dist', que es donde vivirá el React compilado*/
app.use(express.static(distPath));
/* Cualquier ruta que no esté aquí se la mandamos a React */
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});


app.listen(port, async () => {
    console.log(`La app está escuchando en el puerto ${port}`)
    try {
        pool = await connectDB();
        console.log('Base de datos conectada')
    } catch (error) {
        console.log('Deteniendo el servidor por fallo en BD.');
    }
})
