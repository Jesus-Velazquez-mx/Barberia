import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Solo se monta esta ruta (no toca la base de datos); la zona se fija mockeando globalConfig.
const mockConfig = { BUSINESS_TIMEZONE: 'America/Mazatlan' };
jest.unstable_mockModule('../src/config/globalConfig.js', () => ({ default: mockConfig }));

const { default: businessTimezoneRoutes } = await import('../src/routes/businessTimezoneRoutes.js');

const app = express();
app.use('/api', businessTimezoneRoutes);

describe('GET /api/business-timezone', () => {
    test('devuelve BUSINESS_TIMEZONE en el envelope estándar, sin autenticación', async () => {
        const response = await request(app).get('/api/business-timezone');

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            data: 'America/Mazatlan',
            message: expect.any(String),
        });
    });

    test('refleja el valor configurado', async () => {
        mockConfig.BUSINESS_TIMEZONE = 'America/Mexico_City';

        const response = await request(app).get('/api/business-timezone');

        expect(response.body.data).toBe('America/Mexico_City');
    });
});
