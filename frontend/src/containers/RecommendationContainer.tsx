import { useEffect, useState } from 'react';
import { CirclePlus } from 'lucide-react';
import { Button } from '../components/ButtonComponent';
import { PhotoInput } from '../components/PhotoInputComponent';
import { RecommendationHistory } from '../components/RecommendationHistoryComponent';
import { useAuth } from '../context/AuthContext';
import { getRecommendationHistory } from '../services/recommendationService';
import type { HaircutRecommendation } from '../types/recommendation';
import { getApiErrorMessage } from '../utils/apiErrorUtils';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_PREFERENCES_LENGTH = 500;

export function RecommendationContainer() {
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [preferences, setPreferences] = useState('');
  const { user, token } = useAuth();
  const [history, setHistory] = useState<HaircutRecommendation[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');

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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!photo) {
      setPhotoError('Sube o toma una foto para continuar.');
      return;
    }
    // TODO: enviar photo.file y preferences al servicio de recomendaciones
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

        <PhotoInput
          photoUrl={photo?.url ?? null}
          error={photoError}
          onFileSelected={handleFileSelected}
          onClear={handleClearPhoto}
        />

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

        <Button type="submit">Obtener recomendación</Button>
      </form>

      <RecommendationHistory recommendations={history} isLoading={isHistoryLoading} error={historyError} />
    </div>
  );
}
