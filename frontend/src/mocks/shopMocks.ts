import type { ShopRecord } from '../types/shopType';

/* Gerentes disponibles para el select del formulario (usuarios con rol manager). */
export const MOCK_MANAGERS: { value: string; label: string }[] = [
  { value: '2b7e0a10-0001-4c1d-9a3e-100000000001', label: 'Carlos Ramírez' },
  { value: '2b7e0a10-0002-4c1d-9a3e-100000000002', label: 'Miguel Torres' },
  { value: '2b7e0a10-0003-4c1d-9a3e-100000000003', label: 'Luis Herrera' }
];

export const MOCK_SHOPS: ShopRecord[] = [
  {
    id: '9c4f1b20-0001-4e2a-8d5b-200000000001',
    name: 'Mr. Barber Sendero',
    street: 'Av. Revolución',
    postalCode: '82000',
    number: '1250',
    phone: '6691234567',
    managerId: MOCK_MANAGERS[0].value,
    managerName: MOCK_MANAGERS[0].label,
    isActive: true
  },
  {
    id: '9c4f1b20-0002-4e2a-8d5b-200000000002',
    name: 'Mr. Barber Explanada',
    street: 'Calle del Mar',
    postalCode: '82110',
    number: 'S/N',
    phone: '6699876543',
    managerId: MOCK_MANAGERS[1].value,
    managerName: MOCK_MANAGERS[1].label,
    isActive: true
  },
  {
    id: '9c4f1b20-0003-4e2a-8d5b-200000000003',
    name: 'Mr. Barber Plaza ventura',
    street: null,
    postalCode: null,
    number: null,
    phone: null,
    managerId: MOCK_MANAGERS[1].value,
    managerName: MOCK_MANAGERS[1].label,
    isActive: true
  }
];