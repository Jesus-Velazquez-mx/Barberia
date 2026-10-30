import type { SelectOption } from '../components/common/SelectFieldComponent';
import type { StaffRole } from '../types/staffType';

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
    barber: 'Barbero',
    receptionist: 'Recepcionista'
};

/* Opciones del selector de rol en el formulario de personal. */
export const STAFF_ROLE_OPTIONS: SelectOption[] = [
    { value: 'barber', label: STAFF_ROLE_LABELS.barber },
    { value: 'receptionist', label: STAFF_ROLE_LABELS.receptionist }
];

/* Opciones del menú de filtros de la lista de personal. */
export const STAFF_ROLE_FILTER_ALL = 'all';

export const STAFF_ROLE_FILTER_OPTIONS = [
    { value: STAFF_ROLE_FILTER_ALL, label: 'Todos' },
    { value: 'barber', label: 'Barberos' },
    { value: 'receptionist', label: 'Recepcionistas' }
];
