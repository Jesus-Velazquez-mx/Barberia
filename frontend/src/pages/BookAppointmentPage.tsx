import { useSearchParams } from 'react-router-dom';
import { CalendarPlus, Footprints } from 'lucide-react';
import { BookAppointmentContainer } from '../containers/BookAppointmentContainer';
import { Button } from '../components/common/ButtonComponent';
import { useAuth } from '../context/AuthContext';

/* ?walkIn=1: registrar servicio sin cita (solo personal), agenda en el próximo slot de hoy.
   Va en la URL para que el link del menú "Agendar Cita" (sin el parámetro) regrese al modo normal. */
const WALK_IN_PARAM = 'walkIn';

function BookAppointmentPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  if (!user) return null;

  /* El walk-in es exclusivo del personal: un cliente siempre ve el agendado normal. */
  const isStaff = user.role === 'manager' || user.role === 'receptionist';
  const isWalkIn = isStaff && searchParams.get(WALK_IN_PARAM) === '1';

  const toggleWalkIn = () => setSearchParams(isWalkIn ? {} : { [WALK_IN_PARAM]: '1' });

  return (
    <section>
      {/* max-w-190: mismo ancho máximo que los recuadros del formulario, para que el botón quede alineado con su borde derecho. */}
      <div className='grid grid-cols-1 min-[110rem]:gap-6 min-[110rem]:grid-cols-2 mb-6'>
        <div className="flex w-full max-w-190 flex-wrap items-center justify-between gap-4">
          <h1 className="m-0 text-3xl text-(--text-h)">{isWalkIn ? 'Registrar servicio sin cita' : 'Agendar cita'}</h1>
          {isStaff && (
            <Button
              type="button"
              onClick={toggleWalkIn}
              className="inline-flex items-center gap-2 px-4 text-sm! font-semibold! normal-case!"
            >
              {isWalkIn ? <CalendarPlus size={18} aria-hidden="true" /> : <Footprints size={18} aria-hidden="true" />}
              {isWalkIn ? 'Agendar cita con fecha' : 'Registrar servicio sin cita'}
            </Button>
          )}
        </div>
        <div></div>
      </div>
      {/* key: al cambiar de modo el formulario se monta de nuevo, sin arrastrar la selección del otro modo. */}
      <BookAppointmentContainer key={isWalkIn ? 'walk-in' : 'booking'} isWalkIn={isWalkIn} />
    </section>
  );
}

export default BookAppointmentPage;
