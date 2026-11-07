import type { SelectOption } from '../components/common/SelectFieldComponent';

export const GENDER_OPTIONS: SelectOption[] = [
    { value: 'female', label: 'Femenino' },
    { value: 'male', label: 'Masculino' },
    { value: 'other', label: 'Otro' }
];

const GENDER_LABELS: Record<string, string> = {
    female: 'Femenino',
    f: 'Femenino',
    male: 'Masculino',
    m: 'Masculino',
    other: 'Otro'
};

export const getGenderLabel = (gender: string | null | undefined): string => {
    if (!gender) return '—';
    return GENDER_LABELS[gender.trim().toLowerCase()] ?? gender;
};
