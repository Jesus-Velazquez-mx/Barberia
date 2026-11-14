import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Check, ChevronDown, Lock, Plus, X } from 'lucide-react';
import type { AppointmentRecord } from '../../types/appointmentType';
import { formatAppointmentTime, formatPrice } from '../../utils/appointmentUtils';
import { Button } from '../common/ButtonComponent';
import { Modal } from '../common/ModalComponent';
import { AppointmentStatusBadge } from './AppointmentStatusBadgeComponent';

/* ------------------------------------------------------------------ */
/* Constantes (deben coincidir con el backend)                        */
/* ------------------------------------------------------------------ */

// Misma zona que BUSINESS_TIMEZONE del backend.
const BUSINESS_TZ = 'America/Mazatlan';
const RESCHEDULE_WINDOW_DAYS = 30; // desde la fecha en que se agendó
const CLIENT_CUTOFF_HOURS = 8; // solo aplica al rol client
const MS_PER_MIN = 60_000;
const MS_PER_HOUR = 60 * MS_PER_MIN;

/* ------------------------------------------------------------------ */
/* Tipos                                                              */
/* ------------------------------------------------------------------ */

export type UserRole = 'client' | 'receptionist' | 'manager';

export interface ModalService {
  serviceId: string;
  name: string;
  durationMinutes: number;
  price: number;
}

export interface BarberOption {
  id: string;
  name: string;
}

/* AppointmentRecord ya trae todo lo demás; solo se piden los ids que el modal necesita para consultar y guardar. */
export type EditableAppointment = AppointmentRecord & { shopId: string; barberId: string };

export interface SlotsByBarber {
  barberId: string;
  startTimes: string[]; // ISO UTC, como los devuelve GET /shops/:id/availability
}

export interface UpdatePayload {
  barberId?: string;
  scheduledStart?: string;
  serviceIds?: string[];
  notes?: string | null;
}

export interface LoadSlotsParams {
  shopId: string;
  date: string; // YYYY-MM-DD en hora del negocio
  serviceIds: string[];
  excludeAppointmentId: string;
}

interface EditAppointmentModalProps {
  appointment: EditableAppointment;
  role: UserRole;
  /** Servicios activos del catálogo. Los de la cita conservan su snapshot (precio y duración al agendar). */
  catalog: ModalService[];
  /** Barberos de la misma sucursal que aceptan citas (incluye al barbero actual). */
  barbers: BarberOption[];
  /** GET /shops/:shopId/availability excluyendo la propia cita. */
  loadSlots: (params: LoadSlotsParams) => Promise<SlotsByBarber[]>;
  /** PATCH de la cita. Debe lanzar un Error con mensaje legible si falla. */
  onSubmit: (appointmentId: string, payload: UpdatePayload) => Promise<void>;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/* Helpers de fecha (siempre en hora del negocio)                     */
/* ------------------------------------------------------------------ */

const dateKey = (value: string | number | Date): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(value));

const dayLabel = (key: string): string =>
  new Intl.DateTimeFormat('es-MX', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(`${key}T00:00:00Z`))
    .replace(/\./g, '');

/* 75 -> "1 h 15 min", 120 -> "2 h", 30 -> "30 min" */
const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
};

const addDays = (key: string, days: number): string => {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/* ------------------------------------------------------------------ */
/* Piezas (mismo estilo que AppointmentDetailContent)                 */
/* ------------------------------------------------------------------ */

/* El Modal fuerza text-base en <label>, <input> y <button>; el texto chico va en <span>/<div>. */
function Tile({
  label,
  children,
  as: Tag = 'div',
  editable = false,
  locked = false,
  className = ''
}: {
  label: string;
  children: ReactNode;
  as?: 'div' | 'label';
  editable?: boolean;
  /* Campo de solo lectura: se muestra un candado junto al valor. */
  locked?: boolean;
  className?: string;
}) {
  return (
    <Tag
      className={`rounded-lg border bg-black/20 px-3.5 py-2.5 ${
        editable ? 'border-(--accent)' : 'border-white/10'
      } ${className}`}
    >
      <span className="block text-[0.7rem] font-semibold uppercase tracking-wide text-(--text)">{label}</span>
      <div className="mt-0.5 flex items-center justify-between gap-2 text-sm font-semibold text-(--text-h)">
        <div className="min-w-0 flex-1">{children}</div>
        {locked && <Lock size={14} className="shrink-0 text-(--text)" aria-label="No editable" />}
      </div>
    </Tag>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="m-0 mb-3 font-sans text-xs font-bold uppercase tracking-wide text-(--accent)">{children}</h3>
  );
}

/*
 * Selector propio: la lista nativa de <select> no se puede estilizar (fondo gris, sin hover del tema).
 * La lista se ancla al Tile que lo contiene (el Tile debe llevar "relative").
 */
function BarberSelect({
  value,
  options,
  onChange
}: {
  value: string;
  options: BarberOption[];
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  return (
    <div
      ref={rootRef}
      onKeyDown={(event) => {
        // Escape cierra solo la lista, no el modal.
        if (event.key === 'Escape' && open) {
          event.stopPropagation();
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="flex w-full cursor-pointer items-center justify-between gap-2 border-0 bg-transparent !p-0 text-left !text-sm font-semibold text-(--text-h) outline-none"
      >
        <span className="truncate">{selected?.name ?? 'Elige un barbero'}</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`shrink-0 text-(--accent) transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute inset-x-0 top-full z-20 m-0 mt-1.5 list-none overflow-hidden rounded-lg border border-white/10 bg-[#1E1E1E] p-1 shadow-xl shadow-black/50"
        >
          {options.map((option) => {
            const isSelected = option.id === value;
            return (
              <li key={option.id} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border-0 px-3 py-2 text-left !text-sm font-semibold transition-colors ${
                    isSelected
                      ? 'bg-(--accent)/15 text-(--text-h)'
                      : 'bg-transparent text-(--text) hover:bg-white/5 hover:text-(--text-h)'
                  }`}
                >
                  {option.name}
                  {isSelected && <Check size={14} aria-hidden="true" className="shrink-0 text-(--accent)" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const fieldControl ='w-full bg-transparent !p-0 !text-sm font-semibold text-(--text-h) outline-none [color-scheme:dark]';
const notice = 'rounded-lg border px-3 py-2 text-sm';

/* ------------------------------------------------------------------ */
/* Componente                                                         */
/* ------------------------------------------------------------------ */

/**
 * Renderízalo de forma condicional ({open && <EditAppointmentModal ... />}) para que el estado
 * del formulario se reinicie cada vez que se abre.
 */
export function EditAppointmentModal({
  appointment,
  role,
  catalog,
  barbers,
  loadSlots,
  onSubmit,
  onClose
}: EditAppointmentModalProps) {
  const isStaff = role !== 'client';

  const originalStartIso = useMemo(() => new Date(appointment.scheduledStart).toISOString(), [appointment]);
  const originalDate = useMemo(() => dateKey(originalStartIso), [originalStartIso]);

  /* Servicios de la cita con su snapshot; los demás vienen del catálogo actual. */
  const currentServices = useMemo<ModalService[]>(
    () =>
      appointment.services.map((s) => ({
        serviceId: s.serviceId,
        name: s.name,
        durationMinutes: s.durationMinutesAtBooking,
        price: s.priceAtBooking
      })),
    [appointment]
  );
  const originalServiceIds = useMemo(() => currentServices.map((s) => s.serviceId), [currentServices]);
  const allServices = useMemo(() => {
    const current = new Set(originalServiceIds);
    return [...currentServices, ...catalog.filter((s) => !current.has(s.serviceId))];
  }, [currentServices, catalog, originalServiceIds]);

  const [date, setDate] = useState(originalDate);
  const [barberId, setBarberId] = useState(appointment.barberId);
  const [startIso, setStartIso] = useState(originalStartIso);
  const [serviceIds, setServiceIds] = useState<string[]>(originalServiceIds);
  const [notes, setNotes] = useState(appointment.notes ?? '');

  const [slots, setSlots] = useState<SlotsByBarber[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isAddingService, setIsAddingService] = useState(false);
  /* Los horarios disponibles arrancan plegados; se muestran al hacer clic en la flecha. */
  const [isSlotsOpen, setIsSlotsOpen] = useState(false);

  /* Se muestran en el orden en que quedaron (los originales primero, los nuevos al final). */
  const selectedServices = serviceIds
    .map((id) => allServices.find((s) => s.serviceId === id))
    .filter((s): s is ModalService => s !== undefined);
  const availableToAdd = allServices.filter((s) => !serviceIds.includes(s.serviceId));
  const totalMinutes = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const originalTotal = currentServices.reduce((sum, s) => sum + s.price, 0);

  const addService = (id: string) => {
    setServiceIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    // Si ya no queda nada por agregar, se cierra la lista.
    if (availableToAdd.length <= 1) setIsAddingService(false);
  };
  const removeService = (id: string) => setServiceIds((prev) => prev.filter((x) => x !== id));

  /* ---------- Bloqueos (mismas reglas que loadModifiableAppointment) ---------- */

  const lockReason = useMemo(() => {
    const startMs = Date.parse(appointment.scheduledStart);
    const now = Date.now();
    if (appointment.status !== 'scheduled' && appointment.status !== 'rescheduled') {
      return 'Solo se pueden editar citas agendadas o reagendadas.';
    }
    if (startMs <= now) return 'Esta cita ya comenzó, no se puede editar.';
    if (role === 'client' && startMs - now < CLIENT_CUTOFF_HOURS * MS_PER_HOUR) {
      return `No puedes modificar la cita con menos de ${CLIENT_CUTOFF_HOURS} horas de anticipación.`;
    }
    return null;
  }, [appointment, role]);

  /* ---------- Rango de fechas permitido ---------- */

  const minDate = dateKey(Date.now());
  const maxDate = addDays(dateKey(appointment.createdAt), RESCHEDULE_WINDOW_DAYS);

  /* ---------- Horarios disponibles ---------- */

  const serviceKey = [...serviceIds].sort().join(',');

  useEffect(() => {
    if (lockReason || serviceIds.length === 0 || !date) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    setSlotsError(null);
    loadSlots({ shopId: appointment.shopId, date, serviceIds, excludeAppointmentId: appointment.id })
      .then((result) => {
        if (!cancelled) setSlots(result);
      })
      .catch(() => {
        if (!cancelled) {
          setSlots([]);
          setSlotsError('No se pudieron cargar los horarios. Intenta con otra fecha.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, serviceKey, lockReason, appointment.id, appointment.shopId]);

  const slotOptions = useMemo(() => {
    const fromApi = slots.find((s) => s.barberId === barberId)?.startTimes ?? [];
    // Mismo día y barbero: el inicio actual siempre se puede conservar, aunque ya no caiga en la rejilla
    // (el backend no lo exige cuando solo cambian los servicios).
    const keepsOriginal = date === originalDate && barberId === appointment.barberId;
    if (keepsOriginal && !fromApi.includes(originalStartIso)) return [...fromApi, originalStartIso].sort();
    return fromApi;
  }, [slots, barberId, date, originalDate, originalStartIso, appointment.barberId]);

  // Si el inicio elegido ya no está disponible (cambió fecha, barbero o servicios), no hay selección.
  const effectiveStart = slotOptions.includes(startIso) ? startIso : '';
  const endIso = effectiveStart ? new Date(Date.parse(effectiveStart) + totalMinutes * MS_PER_MIN).toISOString() : '';

  /* ---------- Cambios detectados ---------- */

  const startChanged = effectiveStart !== '' && effectiveStart !== originalStartIso;
  const barberChanged = barberId !== appointment.barberId;
  const servicesChanged =
    serviceIds.length !== originalServiceIds.length || serviceIds.some((id) => !originalServiceIds.includes(id));
  const notesChanged = isStaff && notes.trim() !== (appointment.notes ?? '').trim();
  const willReschedule = startChanged || barberChanged;
  const dirty = willReschedule || servicesChanged || notesChanged;
  const canSave = !lockReason && dirty && serviceIds.length > 0 && effectiveStart !== '' && !saving;

  /* ---------- Guardar: solo se envía lo que cambió ---------- */

  const handleClose = () => {
    if (!saving) onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave) {
      // El botón de envío no se deshabilita, así que se explica por qué no se guardó.
      if (!lockReason) {
        if (serviceIds.length === 0) setError('Elige al menos un servicio.');
        else if (effectiveStart === '') {
          // Se despliegan los horarios para que se vea qué falta elegir.
          setIsSlotsOpen(true);
          setError('Elige un horario disponible.');
        }
        else if (!dirty) setError('No hay cambios que guardar.');
      }
      return;
    }

    const payload: UpdatePayload = {};
    if (barberChanged) payload.barberId = barberId;
    if (startChanged) payload.scheduledStart = effectiveStart;
    if (servicesChanged) payload.serviceIds = serviceIds;
    if (notesChanged) payload.notes = notes.trim() || null;

    setSaving(true);
    setError(null);
    try {
      await onSubmit(appointment.id, payload);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la cita.');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Render ---------- */

  return (
    /* Se usa Modal directamente (y no FormModal) para poder poner el badge de estado en el encabezado.
       La estructura y las clases replican las de FormModal. */
    <Modal isOpen onClose={handleClose} closeOnOutsideClick={!saving} className="!max-w-lg">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-xl font-semibold text-(--text-h)">Editar cita</h2>
          <span className="mt-1 block text-[0.9rem] text-(--text)">ID: {appointment.id.slice(0, 8)}</span>
        </div>
        <div className="flex items-center gap-3">
          <AppointmentStatusBadge status={appointment.status} />
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar"
            className="cursor-pointer text-(--text) transition-colors hover:text-(--text-h)"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <fieldset disabled={!!lockReason || saving} className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0 disabled:opacity-60">
        {isStaff && (
          <Tile label="Cliente">
            <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
              <span>{appointment.clientName}</span>
              <span className="font-normal text-(--text)">{appointment.clientEmail ?? 'Sin correo'}</span>
              {!appointment.isRegisteredClient && (
                <span className="rounded-full bg-[#2C2C2C] px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-(--text)">
                  Visitante
                </span>
              )}
            </span>
          </Tile>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Tile as="label" label="Fecha" editable className="col-span-2">
            <input
              type="date"
              value={date}
              min={minDate}
              max={maxDate}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className={fieldControl}
            />
            <span className="mt-0.5 block text-xs font-normal text-(--text)">Hasta el {dayLabel(maxDate)}</span>
          </Tile>

          <Tile label="Barbero" editable className="relative">
            <BarberSelect value={barberId} options={barbers} onChange={setBarberId} />
          </Tile>

          <Tile label="Sucursal" locked>
            {appointment.shopName}
          </Tile>
        </div>

        <section>
          <button
            type="button"
            onClick={() => setIsSlotsOpen((open) => !open)}
            aria-expanded={isSlotsOpen}
            aria-controls="available-slots"
            className="flex w-full cursor-pointer items-center justify-between gap-3 border-0 bg-transparent !p-0 text-left"
          >
            <span className="font-sans text-xs font-bold uppercase tracking-wide text-(--accent)">
              Horarios disponibles
              {totalMinutes > 0 && <span className="font-normal normal-case text-(--text)"> · {totalMinutes} min</span>}
            </span>
            <ChevronDown
              size={18}
              aria-hidden="true"
              className={`shrink-0 text-(--accent) transition-transform ${isSlotsOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Resumen siempre visible, aunque la lista esté plegada. */}
          <span className="mt-1 block text-sm text-(--text)">
            {effectiveStart
              ? `${effectiveStart === originalStartIso ? 'Horario actual' : 'Nuevo horario'}: ${dayLabel(date)} · ${formatAppointmentTime(effectiveStart)} - ${formatAppointmentTime(endIso)}`
              : loadingSlots
                ? 'Cargando horarios…'
                : serviceIds.length > 0 && !slotsError && slotOptions.length === 0
                  ? 'No hay horarios disponibles ese día.'
                  : 'Elige un horario'}
          </span>

          {isSlotsOpen && (
            <div id="available-slots" className="mt-3">
              {loadingSlots && <span className="text-sm text-(--text)">Cargando horarios…</span>}
              {slotsError && (
                <div className={`${notice} border-[#ff4d4d]/40 bg-[#ff4d4d]/10 text-[#ff4d4d]`}>{slotsError}</div>
              )}
              {!loadingSlots && !slotsError && serviceIds.length > 0 && slotOptions.length === 0 && (
                <span className="text-sm text-(--text)">
                  No hay horarios disponibles ese día. Prueba con otra fecha o barbero.
                </span>
              )}
              <div className="flex flex-wrap gap-2">
                {slotOptions.map((iso) => {
                  const selected = iso === effectiveStart;
                  return (
                    <button
                      type="button"
                      key={iso}
                      onClick={() => setStartIso(iso)}
                      aria-pressed={selected}
                      className={`cursor-pointer rounded-lg border px-3.5 py-1.5 !text-sm transition-colors ${
                        selected
                          ? 'border-(--accent) bg-(--accent)/15 text-(--text-h)'
                          : 'border-white/15 bg-black/20 text-(--text-h) hover:border-(--accent)'
                      }`}
                    >
                      {formatAppointmentTime(iso)}
                      {iso === originalStartIso && <span className="text-(--text)"> · actual</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <section>
          <SectionTitle>Servicios</SectionTitle>
          <ul className="m-0 list-none p-0">
            {selectedServices.map((s) => (
              <li
                key={s.serviceId}
                className="flex items-center justify-between gap-4 border-b border-white/5 py-3 text-sm first:pt-0"
              >
                <span className="text-(--text-h)">
                  {s.name}
                  <span className="ml-2 text-xs text-(--text)">{s.durationMinutes} min</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-semibold text-(--text-h)">{formatPrice(s.price)}</span>
                  {selectedServices.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeService(s.serviceId)}
                      aria-label={`Quitar ${s.name}`}
                      className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-(--text) transition-colors hover:bg-white/10 hover:text-(--text-h)"
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>

          {availableToAdd.length > 0 && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setIsAddingService((open) => !open)}
                aria-expanded={isAddingService}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-4 py-2 !text-sm font-semibold text-(--text) transition-colors hover:border-(--accent)/60 hover:text-(--text-h)"
              >
                <span
                  aria-hidden="true"
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-(--accent) text-(--accent)"
                >
                  <Plus size={12} />
                </span>
                Añadir otro servicio
              </button>

              {isAddingService && (
                <ul className="m-0 mt-2 list-none overflow-hidden rounded-lg border border-white/10 bg-black/20 p-0">
                  {availableToAdd.map((s) => (
                    <li key={s.serviceId} className="border-b border-white/5 last:border-b-0">
                      <button
                        type="button"
                        onClick={() => addService(s.serviceId)}
                        className="flex w-full cursor-pointer items-center justify-between gap-4 px-3.5 py-2.5 text-left !text-sm text-(--text-h) transition-colors hover:bg-white/5"
                      >
                        <span>
                          {s.name}
                          <span className="ml-2 text-xs text-(--text)">{s.durationMinutes} min</span>
                        </span>
                        <span className="font-semibold">{formatPrice(s.price)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="mt-4 flex items-start justify-between gap-4 border-t border-white/10 pt-4">
            <span className="font-sans text-xs font-bold uppercase tracking-wide text-(--accent)">Total</span>
            <div className="text-right">
              <span className="block text-2xl font-semibold text-(--accent)">{formatPrice(totalPrice)}</span>
              <span className="block text-base text-(--text)">{formatDuration(totalMinutes)}</span>
              {totalPrice !== originalTotal && (
                <span className="block text-xs text-(--text)">Antes {formatPrice(originalTotal)}</span>
              )}
            </div>
          </div>
        </section>

        {isStaff && (
          <section>
            <SectionTitle>Notas</SectionTitle>
            <textarea
              rows={3}
              value={notes}
              placeholder="Agregar una nota interna…"
              onChange={(e) => setNotes(e.target.value)}
              className="w-full resize-y rounded-lg border border-white/10 bg-black/20 px-3.5 py-2.5 text-sm text-(--text-h) outline-none placeholder:text-(--text) focus:border-(--accent)"
            />
          </section>
        )}
      </fieldset>

      {!lockReason && willReschedule && (
        <div className={`${notice} border-(--accent)/40 bg-(--accent)/10 text-(--text-h)`}>
          Al guardar, la cita pasará a <strong>Reagendada</strong>.
        </div>
      )}
      {!lockReason && role === 'client' && (
        <span className="text-xs text-(--text)">
          Puedes editar hasta {CLIENT_CUTOFF_HOURS} horas antes de la cita y reagendar hasta {RESCHEDULE_WINDOW_DAYS} días
          después de la fecha en que la agendaste.
        </span>
      )}
        {(lockReason || error) && (
          <p className="text-center text-[0.85rem] font-semibold text-[#ff4d4d]" role="alert">
            {lockReason ?? error}
          </p>
        )}

        {/* Sticky dentro del scroll del Modal; -mx-8 compensa su px-8 para que la barra llegue a los bordes */}
        <div className="sticky bottom-0 -mx-8 mt-2 flex justify-end gap-3 border-t border-white/10 bg-[#1E1E1E] px-8 pb-6 pt-4">
          <Button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="h-12! border! border-solid! border-(--text)! bg-transparent! px-8! normal-case! text-(--text)!"
          >
            Cancelar
          </Button>
          <Button type="submit" isLoading={saving} loadingText="Guardando..." className="h-12! px-8! normal-case!">
            Guardar cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default EditAppointmentModal;