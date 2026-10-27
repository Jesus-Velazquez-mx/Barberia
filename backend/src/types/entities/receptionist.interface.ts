export interface Receptionist {
    user_id: string;
    shop_id: string;
    shift_id: string;
    deleted_at: Date | null;
}

/**
 * Fila resultante de unir `receptionists` con `users`: los datos personales viven en `users`
 * y la asignación (sucursal, turno) y la baja lógica en `receptionists`. No incluye password_hash.
 */
export interface ReceptionistWithUser extends Receptionist {
    email: string;
    phone: string | null;
    first_name: string;
    last_name: string;
    birth_date: Date;
    gender: string;
    created_at: Date;
    updated_at: Date;
}
