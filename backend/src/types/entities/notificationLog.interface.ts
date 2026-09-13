export type NotificationStatus = 'sent' | 'failed' | 'pending';

export interface NotificationLog {
    id: string;
    appointment_id: string;
    client_id: string;
    status: NotificationStatus;
    trigger_type: string;
    scheduled_for: Date;
    sent_at: Date | null;
    failure_reason: string | null;
    provider_message_id: string | null;
    retry_count: number;
    created_at: Date;
    updated_at: Date;
}