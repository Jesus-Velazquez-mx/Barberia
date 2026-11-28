import { getRewardDiscount } from '../src/utils/appointmentMapper.js';

const service = (service_id: string, price_at_booking: number) => ({ service_id, price_at_booking });

const lowId = '11111111-1111-4111-8111-111111111111';
const highId = '99999999-9999-4999-8999-999999999999';

describe('getRewardDiscount', () => {
    test('sin servicios no hay descuento', () => {
        expect(getRewardDiscount([])).toBeNull();
    });

    test('con un solo servicio, ese es el gratis', () => {
        expect(getRewardDiscount([service(highId, 450)])).toEqual({ serviceId: highId, amount: 450 });
    });

    test.each([
        ['primero', [service(highId, 150), service(lowId, 450)]],
        ['al final', [service(lowId, 450), service(highId, 150)]],
    ])('gana el precio más bajo aunque venga %s y tenga el serviceId mayor', (_position, services) => {
        expect(getRewardDiscount(services)).toEqual({ serviceId: highId, amount: 150 });
    });

    test.each([
        ['ascendente', [service(lowId, 200), service(highId, 200)]],
        ['descendente', [service(highId, 200), service(lowId, 200)]],
    ])('en empate de precio gana el menor serviceId (entrada en orden %s)', (_order, services) => {
        expect(getRewardDiscount(services)).toEqual({ serviceId: lowId, amount: 200 });
    });
});
