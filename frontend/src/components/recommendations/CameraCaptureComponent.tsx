import { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

const CAMERA_ERROR_MESSAGES: Record<string, string> = {
  NotAllowedError: 'Permiso de cámara denegado. Habilítalo en tu navegador o sube una foto.',
  NotFoundError: 'No se encontró ninguna cámara en este dispositivo.',
  NotReadableError: 'La cámara está siendo usada por otra aplicación.'
};

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Tu navegador no permite usar la cámara. Sube una foto en su lugar.');
      return;
    }

    let stream: MediaStream | null = null;
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((mediaStream) => {
        // El componente se desmontó antes de obtener permiso: libera la cámara de inmediato
        if (cancelled) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = mediaStream;
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const name = err instanceof DOMException ? err.name : '';
        setError(CAMERA_ERROR_MESSAGES[name] ?? 'No se pudo acceder a la cámara.');
      });

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !isReady) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(new File([blob], `captura-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.92
    );
  };

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-[#ff4d4d]/40 bg-[#121212] p-6 text-center">
        <p className="text-sm text-[#ff4d4d]" role="alert">
          {error}
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="h-10 cursor-pointer rounded-lg border border-white/10 bg-transparent px-5 text-sm font-semibold text-(--text-h) hover:bg-white/5"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedMetadata={() => setIsReady(true)}
          className="aspect-4/3 w-full object-cover"
        />
        {!isReady && (
          <span className="absolute inset-0 flex items-center justify-center text-sm text-(--text)">
            Iniciando cámara...
          </span>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleCapture}
          disabled={!isReady}
          className="flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-none bg-(--accent) font-bold uppercase text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Camera size={18} aria-hidden="true" />
          Tomar foto
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-transparent px-5 text-sm font-semibold text-(--text-h) hover:bg-white/5"
        >
          <X size={18} aria-hidden="true" />
          Cancelar
        </button>
      </div>
    </div>
  );
}
