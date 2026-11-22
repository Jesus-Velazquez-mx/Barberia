import { autoCheckInWalkIns } from '../services/appointmentService.js';
import type { Job } from './types.js';

export const walkInCheckInJob: Job = {
    name: 'auto-check-in-walk-ins',
    run: async ({ now }) => ({ affected: await autoCheckInWalkIns(now) }),
};
