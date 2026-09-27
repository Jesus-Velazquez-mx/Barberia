import { apiClient } from './apiClient';
import type { ChangePasswordFormValues, EditUserFormValues, User } from '../types/auth';

interface UpdateUserPayload {
    user: { id: string } & Partial<EditUserFormValues>;
    token: string;
}

export const updateUser = async (id: string, values: EditUserFormValues, token: string): Promise<User> => {
    const payload: UpdateUserPayload = {
        user: { id, ...values },
        token,
    };

    const response = await apiClient.put<User>('/users', payload, {
        headers: { Authorization: `Bearer ${token}` },
    });

    return response;
};
interface ChangePasswordPayload {
    user: {
        id: string;
        password: string;
    };
    token: string;
}

export const changePassword = async (
    id: string,
    values: Omit<ChangePasswordFormValues, 'confirmNewPassword'>,
    token: string
): Promise<User> => {
    const payload: ChangePasswordPayload = {
        user: {
            id,
            password: values.newPassword,
        },
        token,
    };

    const response = await apiClient.put<User>('/users', payload, {
        headers: { Authorization: `Bearer ${token}` },
    });

    return response;
};
