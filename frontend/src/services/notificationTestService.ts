import { apiClient } from './apiClient';

export interface TestReminderResult {
    totalFound: number;
    sent: number;
    withoutTelegram: number;
    failed: number;
}

export const reminderTest = async (token: string): Promise<TestReminderResult> => {
    const { data } = await apiClient.post<TestReminderResult>(
        '/notifications/reminders/test',
        undefined,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
};