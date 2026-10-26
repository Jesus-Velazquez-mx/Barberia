import type { ReceptionistWithUser } from '../types/entities/receptionist.interface.js';
import type { ReceptionistDetailResponse } from '../types/dto/receptionistResponse.interface.js';

export const toReceptionistDetailResponse = (receptionist: ReceptionistWithUser): ReceptionistDetailResponse => {
    return {
        userId: receptionist.user_id,
        shopId: receptionist.shop_id,
        shiftId: receptionist.shift_id,
        firstName: receptionist.first_name,
        lastName: receptionist.last_name,
        email: receptionist.email,
        phone: receptionist.phone,
        birthDate: receptionist.birth_date,
        gender: receptionist.gender,
        deletedAt: receptionist.deleted_at,
        createdAt: receptionist.created_at,
        updatedAt: receptionist.updated_at,
    };
};
