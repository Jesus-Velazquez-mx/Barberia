import { useState } from 'react';
import { AlertCircle, CalendarCheck, ChevronDown, Gift, RotateCw, Star } from 'lucide-react';
import type { LoyaltyStatus } from '../../types/loyaltyType';
import { Button } from '../common/ButtonComponent';

interface ClientLoyaltyProgressProps {
  status: LoyaltyStatus | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onBookAppointment: () => void;
  onViewAppointments: () => void;
}

export function ClientLoyaltyProgress({
  status,
  isLoading,
  error,
  onRetry,
  onBookAppointment,
  onViewAppointments
}: ClientLoyaltyProgressProps) {
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  const threshold = status ? Math.max(status.threshold, 1) : 1;
  const completed = status ? Math.max(status.completedServicesCount, 0) : 0;
  const filledStamps = Math.min(completed, threshold);
  const surplus = Math.max(0, completed - threshold);

  const helperLabel = status
    ? !status.rewardAvailable
      ? status.appointmentsUntilReward === 1
        ? 'Falta 1 cita'
        : `Faltan ${status.appointmentsUntilReward} citas`
      : surplus > 0
        ? `+${surplus} ${surplus === 1 ? 'cita extra acumulada' : 'citas extra acumuladas'}`
        : 'Meta alcanzada'
    : '';

  return (
    <section
      aria-labelledby="loyalty-progress-heading"
      className="rounded-xl border border-white/10 bg-[#1E1E1E] p-5 sm:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-(--accent)/40 bg-(--accent)/10 text-(--accent)">
            <Gift size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2
              id="loyalty-progress-heading"
              className="m-0 font-sans text-xl font-semibold tracking-normal text-(--text-h)"
            >
              Programa de lealtad
            </h2>
            <p className="mt-1 text-sm text-(--text)">
              Acumula citas completadas y obtén un servicio gratis automáticamente.
            </p>
          </div>
        </div>

        {status !== null && (status.hasOpenRewardAppointment || status.rewardAppliesOnNextBooking) && (
          <span
            className={
              status.hasOpenRewardAppointment
                ? 'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-(--accent)/50 bg-(--accent)/10 px-3 py-1 text-xs font-semibold text-(--accent)'
                : 'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-(--accent)/60 bg-(--accent)/15 px-3 py-1 text-xs font-semibold text-(--accent)'
            }
          >
            {status.hasOpenRewardAppointment ? (
              'Cita de recompensa abierta'
            ) : (
              <>
                <Star size={12} fill="currentColor" aria-hidden="true" />
                Recompensa disponible
              </>
            )}
          </span>
        )}
      </div>

      {isLoading && !status && (
        <div role="status" aria-busy="true" className="mt-6 flex flex-col gap-4">
          <span className="sr-only">Cargando progreso de lealtad...</span>
          <div className="h-5 w-48 animate-pulse rounded bg-white/10" />
          <div className="flex flex-wrap items-center justify-center gap-2 py-2 sm:gap-4">
            {Array.from({ length: 6 }, (_, index) => (
              <span key={index} className="h-9 w-9 animate-pulse rounded-full bg-white/10 sm:h-14 sm:w-14" />
            ))}
          </div>
          <div className="h-20 w-full animate-pulse rounded-lg bg-white/5" />
        </div>
      )}

      {error && !status && (
        <div
          role="alert"
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ff4d4d]/40 bg-[#ff4d4d]/10 px-4 py-3 text-sm font-medium text-[#ffb3b3]"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <AlertCircle size={18} className="shrink-0 text-[#ff4d4d]" aria-hidden="true" />
            <span>{error}</span>
          </div>

          <button
            type="button"
            onClick={onRetry}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#262626] px-3 py-1.5 text-xs font-semibold text-(--text-h) transition-colors hover:border-(--accent)/60 sm:w-auto"
          >
            <RotateCw size={14} aria-hidden="true" />
            Reintentar
          </button>
        </div>
      )}

      {status !== null && (
        <div className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-lg font-semibold text-(--text-h)">
                {completed} de {threshold} citas completadas
              </p>
              <span className="text-sm font-semibold text-(--accent)">{helperLabel}</span>
            </div>

            <div
              role="progressbar"
              aria-valuenow={filledStamps}
              aria-valuemin={0}
              aria-valuemax={threshold}
              aria-label="Progreso de citas completadas para recompensa"
              className="flex flex-wrap items-center justify-center gap-2 py-2 sm:gap-4"
            >
              {Array.from({ length: threshold }, (_, index) => {
                const isEarned = index < filledStamps;
                return (
                  <span
                    key={index}
                    aria-hidden="true"
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors sm:h-14 sm:w-14 ${
                      isEarned
                        ? 'border-(--accent) bg-(--accent)/15 text-(--accent)'
                        : 'border-white/25 bg-[#121212] text-white/30'
                    }`}
                  >
                    <Star
                      className="h-5 w-5 sm:h-8 sm:w-8"
                      fill={isEarned ? 'currentColor' : 'none'}
                      strokeWidth={1.75}
                    />
                  </span>
                );
              })}
            </div>
          </div>

          {status.hasOpenRewardAppointment ? (
            <div className="flex flex-col gap-3 rounded-lg border border-(--accent)/35 bg-(--accent)/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <CalendarCheck size={20} className="mt-0.5 shrink-0 text-(--accent)" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-(--text-h)">Ya tienes una cita de recompensa abierta</p>
                  <p className="mt-1 text-sm text-(--text)">
                    Tu servicio gratis ya está reservado en una cita pendiente. Mientras siga abierta, cualquier nueva
                    cita que agendes será normal y no incluirá un segundo servicio gratis.
                    {surplus > 0
                      ? ` Al completarla, conservarás ${surplus} ${
                          surplus === 1 ? 'cita adicional' : 'citas adicionales'
                        } de progreso.`
                      : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onViewAppointments}
                className="h-10 w-full shrink-0 cursor-pointer rounded-lg border border-(--accent) bg-transparent px-4 text-sm font-semibold text-(--accent) transition-colors hover:bg-(--accent)/10 sm:w-auto"
              >
                Ver mis citas
              </button>
            </div>
          ) : status.rewardAppliesOnNextBooking ? (
            <div className="flex flex-col gap-4 rounded-lg border border-(--accent)/50 bg-(--accent)/15 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <Star size={20} fill="currentColor" className="mt-0.5 shrink-0 text-(--accent)" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-(--text-h)">Tu próxima cita incluye un servicio gratis</p>
                  <p className="mt-1 text-sm text-(--text)">
                    No necesitas activar nada: al agendar tu siguiente cita, el servicio de menor precio será gratis
                    automáticamente.
                    {surplus > 0
                      ? ` Al completarla se restarán ${threshold} al contador y conservarás ${surplus} de progreso.`
                      : ''}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={onBookAppointment}
                className="h-10! w-full! shrink-0! px-5! text-sm! normal-case! sm:w-auto!"
              >
                Agendar cita
              </Button>
            </div>
          ) : null}

          <div className="rounded-lg border border-white/10 bg-[#121212]">
            <button
              type="button"
              aria-expanded={isRulesOpen}
              aria-controls="loyalty-rules-panel"
              onClick={() => setIsRulesOpen((prev) => !prev)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 p-4 text-left text-sm font-semibold text-(--text-h) transition-colors hover:text-(--accent) sm:px-5"
            >
              <span>¿Cómo funciona el programa de lealtad?</span>
              <ChevronDown
                size={18}
                aria-hidden="true"
                className={`shrink-0 text-(--text) transition-transform ${isRulesOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isRulesOpen && (
              <div id="loyalty-rules-panel" className="border-t border-white/10 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
                <ul className="m-0 list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-(--text) sm:text-sm">
                  <li>Cada cita completada cuenta como 1.</li>
                  <li>
                    Al reunir {threshold} citas completadas, la recompensa se aplica automáticamente a la siguiente cita
                    que agendes, sobre el servicio de menor precio (no necesitas activar ninguna opción).
                  </li>
                  <li>Solo puedes tener una cita de recompensa abierta a la vez.</li>
                  <li>
                    Si cancelas una cita de recompensa, conservas tu recompensa para la siguiente cita que agendes.
                  </li>
                  <li>
                    Si no asistes a una cita de recompensa (no-show), pierdes la recompensa y todo tu progreso se
                    reinicia a 0.
                  </li>
                  <li>
                    Después de completar tu cita gratis, se restan {threshold} al contador y el progreso que exceda{' '}
                    {threshold} se conserva (por ejemplo, {threshold + 2} pasa a 2).
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
