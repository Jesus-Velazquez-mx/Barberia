import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/*
 * Integración contra el microservicio de IA REAL. No se ejecuta en CI: requiere
 * el servicio corriendo y AI_SERVICE_URL / AI_SERVICE_API_KEY válidos.
 *
 *   RUN_AI_INTEGRATION=1 npm test -- faceShapeDetection.integration
 *
 * Sin la variable, el bloque se marca como "skipped". Las pruebas unitarias con
 * mocks están en faceShapeDetection.test.ts.
 */
const describeIntegration = process.env.RUN_AI_INTEGRATION === '1' ? describe : describe.skip;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describeIntegration('Integración con el microservicio de IA - detección facial', () => {
    const testCases = [
        { tipo: 'heart', filename: 'images/corazon.jpg', mime: 'image/jpeg' },
        { tipo: 'oval', filename: 'images/ovalada.png', mime: 'image/png' },
        { tipo: 'round', filename: 'images/redonda.png', mime: 'image/png' },
        { tipo: 'square', filename: 'images/cuadrada.png', mime: 'image/png' },
    ];

    test.each(testCases)('detecta el rostro tipo $tipo', async ({ tipo, filename, mime }) => {
        const imageBuffer = fs.readFileSync(path.join(__dirname, filename));
        const photo = `data:${mime};base64,${imageBuffer.toString('base64')}`;

        // Import dinámico: si el bloque se omite no se carga el servicio ni la conexión a la BD
        const { detectFacialStructure } = await import('../src/services/aiService.js');
        const response = await detectFacialStructure(photo);

        expect(response.data).toBe(tipo);
    });
});
