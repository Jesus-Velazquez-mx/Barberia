export type AppointmentStatus =
  | 'scheduled'
  | 'checked_in'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface AppointmentService {
  id: string;
  name: string;
}

export interface Appointment {
  id: string;
  status: AppointmentStatus;
  scheduledStart: string;
  scheduledEnd: string;
  barber: { id: string; name: string };
  shop: { id: string; name: string };
  isRewardRedemption: boolean;
  service?: AppointmentService | null;
  notes?: string | null;
  checkedInAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
}