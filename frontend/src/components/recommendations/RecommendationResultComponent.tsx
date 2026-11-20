import { useState } from 'react';
import { X } from 'lucide-react';
import { Modal } from '../common/ModalComponent';
import { HaircutChip } from './HaircutChipComponent';
import { useHaircutImageUrls } from '../../hooks/useHaircutImageUrls';
import type { GeneratedRecommendation, HaircutStyle } from '../../types/recommendation';

interface RecommendationResultProps {
  isOpen: boolean;
  onClose: () => void;
  /* Mensaje que devuelve el backend junto con el resultado. */
  message: string;
  result: GeneratedRecommendation;
}

/* Referencia estable para el caso sin cortes recomendados (el hook depende de la identidad del arreglo). */
const NO_HAIRCUTS: HaircutStyle[] = [];

export function RecommendationResult({ isOpen, onClose, message, result }: RecommendationResultProps) {
  const haircuts = result.status === 'recommended' ? result.haircuts : NO_HAIRCUTS;
  // Precarga las fotos al mostrarse el resultado; solo trae las URLs de los cortes que sí tienen foto
  const imageUrls = useHaircutImageUrls(haircuts, isOpen);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedHaircut = haircuts.find((haircut) => haircut.id === selectedId);
  const selectedImageUrl = selectedHaircut ? imageUrls[selectedHaircut.id] : undefined;

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
                <HaircutChip
                  key={haircut.id}
                  name={haircut.name}
                  hasImage={haircut.id in imageUrls}
                  isSelected={haircut.id === selectedId}
                  onSelect={() => setSelectedId((current) => (current === haircut.id ? null : haircut.id))}
                />
              ))}
            </ul>
            {selectedHaircut && selectedImageUrl && (
              <figure className="m-0 flex flex-col items-center gap-2">
                <img
                  src={selectedImageUrl}
                  alt={`Foto del corte ${selectedHaircut.name}`}
                  className="max-h-80 w-full rounded-lg border border-white/10 object-contain"
                />
                <figcaption className="text-xs text-(--text)">{selectedHaircut.name}</figcaption>
              </figure>
            )}
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
