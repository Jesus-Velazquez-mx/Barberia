import { apiClient } from './apiClient';
import type { ChangePasswordFormValues, EditUserFormValues, User } from '../types/auth';

interface UpdateUserPayload {
    user: { id: string } & Partial<EditUserFormValues>;
}

export const updateUser = async (id: string, values: EditUserFormValues, token: string): Promise<User> => {
    const payload: UpdateUserPayload = {
        user: { id, ...values }
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
        }
    };

    const response = await apiClient.put<User>('/users', payload, {
        headers: { Authorization: `Bearer ${token}` },
    });

    return response;
};

export const deleteUser = async (id: string, token: string): Promise<void> => {
    await apiClient.delete<void>(`/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
};
