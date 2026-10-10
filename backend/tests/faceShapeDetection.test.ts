import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectFacialStructure } from '../src/services/aiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Integración de Microservicio de IA - Detección Facial Parametrizada', () => {
    const testCases = [
        { tipo: 'heart', filename: 'images/corazon.jpg' },
        { tipo: 'oval', filename: 'images/ovalada.png' },
        { tipo: 'round', filename: 'images/redonda.png' },
        { tipo: 'square', filename: 'images/cuadrada.png' },
    ];

    test.each(testCases)('Debería evaluar el rostro tipo $tipo correctamente', async ({ tipo, filename }) => {
        const imagePath = path.join(__dirname, filename);

        if (!fs.existsSync(imagePath)) {
            console.warn(`[Test Warning] No se encontró el archivo de imagen: ${filename}`);
            return;
        }

        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

        const formaDetectada = await detectFacialStructure(base64Image);

        console.log(`[Test] Rostro evaluado -> Esperado: ${tipo} | Detectado por IA: ${formaDetectada}`);

        // Validación estricta: La estructura detectada por la IA DEBE ser igual al tipo esperado del caso de prueba
        expect(formaDetectada).toBe(tipo);
    });
});
