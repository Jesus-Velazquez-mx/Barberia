import { useState } from 'react';
import { ChevronDown, History, Scissors } from 'lucide-react';
import type { HaircutRecommendation } from '../types/recommendation';

interface RecommendationHistoryProps {
  recommendations: HaircutRecommendation[];
  isLoading?: boolean;
  error?: string;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

function HistoryItem({ item }: { item: HaircutRecommendation }) {
  const [isOpen, setIsOpen] = useState(false);
  const isRecommended = item.status === 'recommended';

  return (
    <li className="rounded-lg border border-white/10 bg-[#121212]">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="flex w-full cursor-pointer items-center gap-4 border-none bg-transparent p-4 text-left"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#2A2A2A] text-(--accent)">
          <Scissors size={22} aria-hidden="true" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-(--text-h)">{formatDate(item.requestedAt)}</span>
          <span className="block truncate text-sm text-(--text)">
            {isRecommended ? (item.recommendedHaircut?.name ?? 'Recomendación') : 'Sin corte adecuado'}
          </span>
        </span>

        <ChevronDown
          size={18}
          aria-hidden="true"
          className={`shrink-0 text-(--text) transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="flex flex-col gap-3 border-t border-white/10 p-4">
          {item.suggestionText && (
            <div>
              <span className="text-xs font-semibold uppercase text-(--accent)">Recomendación</span>
              <p className="mt-1 text-sm text-(--text-h)">{item.suggestionText}</p>
            </div>
          )}
          {item.reasoning && (
            <div>
              <span className="text-xs font-semibold uppercase text-(--text)">
                {isRecommended ? 'Por qué' : 'Motivo'}
              </span>
              <p className="mt-1 text-sm text-(--text-h)">{item.reasoning}</p>
            </div>
          )}
          {item.confidence !== null && (
            <span className="text-xs text-(--text)">Confianza: {Math.round(item.confidence)}%</span>
          )}
        </div>
      )}
    </li>
  );
}

export function RecommendationHistory({ recommendations, isLoading = false, error = '' }: RecommendationHistoryProps) {
  return (
    <section className="flex flex-col gap-5 rounded-xl border border-white/10 bg-[#1E1E1E] p-8">
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        <History size={28} className="text-(--accent)" aria-hidden="true" />
        <h2 className="m-0 font-sans text-xl font-semibold text-(--text-h)">Recomendaciones anteriores</h2>
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-sm text-(--text)">Cargando historial...</p>
      ) : error ? (
        <p role="alert" className="py-6 text-center text-sm text-red-400">
          {error}
        </p>
      ) : recommendations.length === 0 ? (
        <p className="py-6 text-center text-sm text-(--text)">
          Aún no has generado ninguna recomendación. Sube una foto para obtener la primera.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {recommendations.map((item) => (
            <HistoryItem key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}
