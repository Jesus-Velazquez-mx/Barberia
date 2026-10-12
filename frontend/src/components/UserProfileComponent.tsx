import type { User, UserRole } from '../types/auth';
import { Button } from './ButtonComponent';

interface UserProfileProps {
  user: User;
  onEdit: () => void;
  onChangePassword: () => void;
  onDeleteAccount: () => void;
  onLogout: () => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  client: 'Cliente',
  barber: 'Barbero',
  manager: 'Gerente',
  receptionist: 'Recepcionista'
};

const GENDER_LABELS: Record<string, string> = {
  female: 'Femenino',
  male: 'Masculino',
  other: 'Otro'
};

/* 6671234567 -> 667 123 4567 */
const formatPhone = (phone: string | null) =>
  phone ? phone.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3') : 'Sin teléfono';

/* 1990-01-01 -> 01/01/1990, sin depender de la zona horaria del navegador */
const formatBirthDate = (birthDate: string) => {
  const [year, month, day] = birthDate.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
};

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-(--text)">{label}</span>
      <div className="truncate rounded-lg border border-white/10 bg-[#121212] px-4 py-3 text-base text-(--text-h)">
        {value}
      </div>
    </div>
  );
}

export function UserProfile({ user, onEdit, onChangePassword, onDeleteAccount, onLogout }: UserProfileProps) {
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="m-0 font-sans text-3xl font-semibold tracking-normal text-(--text-h)">Mi perfil</h1>
        <p className="mt-1 text-sm font-semibold text-(--text)">
          Gestiona tu información personal y la configuración de tu cuenta.
        </p>
      </header>

      <section className="rounded-xl border border-white/10 bg-[#1E1E1E] p-8">
        <div className="flex items-center gap-3 border-b border-white/10 pb-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#2A2A2A] text-sm text-(--accent)">
            {initials}
          </span>
          <span className="text-2xl font-semibold text-(--text-h)">{user.firstName}</span>
          <span className="rounded-full border border-(--text-h) bg-white/10 px-4 py-1 text-sm text-(--text-h)">
            {ROLE_LABELS[user.role]}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <ReadOnlyField label="Nombre Completo" value={`${user.firstName} ${user.lastName}`} />
          <ReadOnlyField label="Correo electrónico" value={user.email} />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
          <ReadOnlyField label="Teléfono" value={formatPhone(user.phone)} />
          <ReadOnlyField label="Fecha de nacimiento" value={formatBirthDate(user.birthDate)} />
          <ReadOnlyField label="Género" value={GENDER_LABELS[user.gender] ?? user.gender} />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            onClick={onChangePassword}
            className="h-10! border! border-solid! border-(--accent)! bg-transparent! px-5! text-sm! normal-case! text-(--accent)!"
          >
            Cambiar Contraseña
          </Button>
          <Button type="button" onClick={onEdit} className="h-10! px-5! text-sm! normal-case!">
            Actualizar Datos
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#1E1E1E] px-8 py-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-base font-semibold text-(--text-h)">Cerrar Sesión</p>
          <p className="mt-1 text-sm font-semibold text-(--text)">
            Saldrás de tu cuenta en este dispositivo. Podrás volver a iniciar sesión cuando quieras.
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="h-10 shrink-0 cursor-pointer rounded-lg border border-(--accent) bg-transparent px-5 text-sm font-semibold text-(--accent) transition-colors hover:bg-(--accent)/10"
        >
          Cerrar Sesión
        </button>
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-red-500/20 bg-[#221A1A] px-8 py-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-base font-semibold text-red-500">Eliminar Cuenta</p>
          <p className="mt-1 text-sm font-semibold text-(--text)">
            Una vez eliminada tu cuenta, se perderá tu historial de citas y puntos de lealtad.
          </p>
        </div>
        <button
          type="button"
          onClick={onDeleteAccount}
          className="h-10 shrink-0 cursor-pointer rounded-lg border border-red-500 bg-transparent px-5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/10"
        >
          Eliminar Cuenta
        </button>
      </section>
    </div>
  );
}
