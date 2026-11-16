import { useCallback, useEffect, useState } from 'react';
import { CirclePlus, LoaderCircle } from 'lucide-react';
import { Button } from '../components/common/ButtonComponent';
import { PhotoInput } from '../components/recommendations/PhotoInputComponent';
import { RecommendationHistory } from '../components/recommendations/RecommendationHistoryComponent';
import { RecommendationResult } from '../components/recommendations/RecommendationResultComponent';
import { useAuth } from '../context/AuthContext';
import {
  getRecommendationHistory,
  isStoredPhotoError,
  requestHaircutRecommendation
} from '../services/recommendationService';
import type { GeneratedRecommendation, HaircutRecommendation } from '../types/recommendation';
import { getApiErrorMessage } from '../utils/apiErrorUtils';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_PREFERENCES_LENGTH = 500;

export function RecommendationContainer() {
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [preferences, setPreferences] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState<{ data: GeneratedRecommendation; message: string } | null>(null);
  const { user, token } = useAuth();
  const [history, setHistory] = useState<HaircutRecommendation[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [reuseLastPhoto, setReuseLastPhoto] = useState(false);

  // La foto de un cliente vive en S3 desde su primera solicitud, así que solo se puede reutilizar si ya tiene historial
  const canReusePhoto = history.length > 0;
  const isReusingPhoto = reuseLastPhoto && canReusePhoto;

  // Carga el historial del cliente autenticado
  useEffect(() => {
    if (!user || !token) return;

    let cancelled = false;
    setIsHistoryLoading(true);
    setHistoryError('');

    getRecommendationHistory(user.id, token)
      .then((entries) => {
        if (!cancelled) setHistory(entries);
      })
      .catch((error) => {
        if (!cancelled) setHistoryError(getApiErrorMessage(error, 'No se pudo cargar el historial. Intenta de nuevo.'));
      })
      .finally(() => {
        if (!cancelled) setIsHistoryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, token]);

  // Libera la URL temporal cuando se reemplaza la foto o se desmonta la página
  useEffect(() => {
    if (!photo) return;
    return () => URL.revokeObjectURL(photo.url);
  }, [photo]);

  const handleFileSelected = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setPhotoError('El archivo debe ser una imagen.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError('La imagen no debe pesar más de 5 MB.');
      return;
    }
    setPhotoError('');
    setPhoto({ file, url: URL.createObjectURL(file) });
  };

  const handleClearPhoto = () => {
    setPhoto(null);
    setPhotoError('');
  };

  // Vuelve a consultar el historial sin mostrar el estado de carga, para incluir la recomendación recién generada
  const refreshHistory = async () => {
    if (!user || !token) return;

    try {
      setHistory(await getRecommendationHistory(user.id, token));
      setHistoryError('');
    } catch (error) {
      setHistoryError(getApiErrorMessage(error, 'No se pudo cargar el historial. Intenta de nuevo.'));
    }
  };

  const closeResult = useCallback(() => setResult(null), []);

  const handleReuseChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReuseLastPhoto(event.target.checked);
    setPhotoError('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || !token) return;
    if (!photo && !isReusingPhoto) {
      setPhotoError('Sube o toma una foto para continuar.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setPhotoError('');
    setResult(null);

    try {
      const { data, message } = await requestHaircutRecommendation(
        isReusingPhoto ? null : (photo?.file ?? null),
        preferences,
        token
      );
      setResult({ data, message });
      await refreshHistory();
    } catch (error) {
      if (isReusingPhoto && isStoredPhotoError(error)) {
        // La foto guardada ya no sirve: se vuelve al selector para que el cliente suba una nueva
        setReuseLastPhoto(false);
        setPhoto(null);
        setPhotoError('No pudimos usar tu última foto. Sube o toma una nueva para continuar.');
      } else {
        setSubmitError(getApiErrorMessage(error, 'No se pudo generar la recomendación. Intenta de nuevo.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-6 rounded-xl border border-white/10 bg-[#1E1E1E] p-8"
      >
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <CirclePlus size={28} className="text-(--accent)" aria-hidden="true" />
          <h2 className="m-0 font-sans text-xl font-semibold text-(--text-h)">Nueva recomendación</h2>
        </div>

        {isReusingPhoto ? (
          <p className="m-0 rounded-lg border border-dashed border-white/20 bg-[#121212] px-6 py-8 text-center text-sm text-(--text)">
            Se usará la última foto que subiste. Desmarca la opción si quieres subir una nueva.
          </p>
        ) : (
          <PhotoInput
            photoUrl={photo?.url ?? null}
            error={photoError}
            onFileSelected={handleFileSelected}
            onClear={handleClearPhoto}
          />
        )}

        {canReusePhoto && (
          <label className="flex cursor-pointer items-center gap-3 text-sm text-(--text-h)">
            <input
              type="checkbox"
              checked={isReusingPhoto}
              onChange={handleReuseChange}
              disabled={isSubmitting}
              className="h-4 w-4 cursor-pointer accent-(--accent)"
            />
            Usar la última foto subida
          </label>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="preferences" className="text-sm text-(--labels)">
            Preferencias <span className="text-(--text)">(opcional)</span>
          </label>
          <textarea
            id="preferences"
            value={preferences}
            onChange={(event) => setPreferences(event.target.value)}
            maxLength={MAX_PREFERENCES_LENGTH}
            rows={5}
            placeholder="Cuéntanos qué buscas: largo, estilo, mantenimiento, ocasión..."
            className="resize-none rounded-lg border border-white/10 bg-[#121212] px-4 py-3 text-base text-(--text-h) placeholder:text-(--text) focus:border-(--accent) focus:outline-none"
          />
          <span className="self-end text-xs text-(--text)">
            {preferences.length}/{MAX_PREFERENCES_LENGTH}
          </span>
        </div>

        {submitError && (
          <p className="text-sm text-[#ff4d4d]" role="alert">
            {submitError}
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting && <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />}
          {isSubmitting ? 'Generando recomendación...' : 'Obtener recomendación'}
        </Button>
      </form>

      {result && <RecommendationResult isOpen onClose={closeResult} message={result.message} result={result.data} />}

      <RecommendationHistory recommendations={history} isLoading={isHistoryLoading} error={historyError} />
    </div>
  );
}
