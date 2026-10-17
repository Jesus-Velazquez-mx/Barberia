import { X } from 'lucide-react';
import { Modal } from './ModalComponent';
import type { GeneratedRecommendation } from '../types/recommendation';

interface RecommendationResultProps {
  isOpen: boolean;
  onClose: () => void;
  /* Mensaje que devuelve el backend junto con el resultado. */
  message: string;
  result: GeneratedRecommendation;
}

export function RecommendationResult({ isOpen, onClose, message, result }: RecommendationResultProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="pb-8">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <h2 className="m-0 font-sans font-semibold text-(--text-h)">Tu recomendación</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="cursor-pointer border-none bg-transparent text-(--text) transition-colors hover:text-(--text-h)"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-4" aria-live="polite">
        {result.status === 'recommended' ? (
          <>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0 justify-center my-6">
              {result.haircuts.map((haircut) => (
                <li
                  key={haircut.id}
                  className="rounded-full border border-(--accent-border) bg-(--accent-bg) px-3 py-1 font-semibold text-(--accent)"
                >
                  {haircut.name}
                </li>
              ))}
            </ul>
            <p className="m-0 text-(--text-h)">{result.suggestionText}</p>
            <div>
              <span className="text-xs font-semibold uppercase text-(--text)">Por qué</span>
              <p className="mt-1 text-sm! text-(--text-h)">{result.reasoning}</p>
            </div>
            <span className="text-xs text-(--text)">Confianza: {Math.round(result.confidence * 100)}%</span>
          </>
        ) : (
          <>
            <p className="m-0 text-(--text-h)">{message}</p>
            <div>
              <span className="text-xs font-semibold uppercase text-(--text)">Motivo</span>
              <p className="mt-1 text-(--text-h)">{result.reason}</p>
            </div>
          </>
        )}
      </div>

      <p className="mt-6 border-t border-white/10 pt-8 text-center text-sm! text-(--text)">
        Puedes volver a ver esta recomendación en tu historial
      </p>
    </Modal>
  );
}
