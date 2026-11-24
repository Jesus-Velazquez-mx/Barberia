import { completeFinishedAppointments } from '../services/appointmentService.js';
import type { Job } from './types.js';

export const completeAppointmentsJob: Job = {
    name: 'complete-checked-in-appointments',
    run: async ({ now }) => ({ affected: await completeFinishedAppointments(now) }),
};