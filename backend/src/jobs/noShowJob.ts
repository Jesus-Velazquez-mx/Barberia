import { markNoShow } from '../services/appointmentService.js';
import type { Job } from './types.js';

export const noShowJob: Job = {
    name: 'mark-appointments-no-show',
    run: async ({ now }) => ({ affected: await markNoShow(now) }),
};