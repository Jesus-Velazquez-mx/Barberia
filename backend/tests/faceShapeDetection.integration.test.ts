/*
 * Integración contra el microservicio de IA REAL. No se ejecuta en CI: requiere
 * el servicio corriendo, AI_SERVICE_URL / AI_SERVICE_API_KEY válidos y una foto
 * ya subida al bucket cuya key empiece con AWS_BUCKET_KEY_PREFIX.
 *
 *   RUN_AI_INTEGRATION=1 AI_INTEGRATION_PHOTO_KEY=user/images/<id>  *     npm test -- faceShapeDetection.integration
 *
 * Opcional: AI_INTEGRATION_EXPECTED_STRUCTURE=heart para comprobar el resultado.
 * Sin RUN_AI_INTEGRATION el bloque se marca como "skipped". Las pruebas
 * unitarias con mocks están en faceShapeDetection.test.ts.
 */
const describeIntegration = process.env.RUN_AI_INTEGRATION === '1' ? describe : describe.skip;

const FACIAL_STRUCTURES = ['oval', 'triangle', 'heart', 'round', 'diamond', 'square', 'rectangle'];

describeIntegration('Integración con el microservicio de IA - detección facial', () => {
    test('clasifica la foto almacenada en el bucket a partir de su key', async () => {
        const photoKey = process.env.AI_INTEGRATION_PHOTO_KEY;
        if (!photoKey) throw new Error('AI_INTEGRATION_PHOTO_KEY is required');

        // Import dinámico: si el bloque se omite no se carga el servicio ni la conexión a la BD
        const { detectFacialStructure } = await import('../src/services/aiService.js');
        const response = await detectFacialStructure(photoKey);

        expect(FACIAL_STRUCTURES).toContain(response.data);
        const expected = process.env.AI_INTEGRATION_EXPECTED_STRUCTURE;
        if (expected) expect(response.data).toBe(expected);
    });
});
