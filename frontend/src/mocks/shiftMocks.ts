import type { Shift } from '../types/shiftType';

/* Mismos valores que el INSERT de shifts; los conteos de personal son solo de ejemplo. */
export const MOCK_SHIFTS: Shift[] = [
  {
    id: '6f1d2c3a-0001-4a5b-8c9d-000000000001',
    name: 'morning',
    startTime: '08:00',
    endTime: '16:00'  
  },
  {
    id: '6f1d2c3a-0002-4a5b-8c9d-000000000002',
    name: 'afternoon',
    startTime: '12:00',
    endTime: '20:00'
  }
];
