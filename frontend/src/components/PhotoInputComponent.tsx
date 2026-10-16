import { useRef, useState } from 'react';
import { Camera, ImagePlus, RotateCcw, Upload } from 'lucide-react';
import { CameraCapture } from './CameraCaptureComponent';

interface PhotoInputProps {
  /* URL de previsualización de la foto elegida; null si todavía no hay. */
  photoUrl: string | null;
  error?: string;
  onFileSelected: (file: File) => void;
  onClear: () => void;
}

export function PhotoInput({ photoUrl, error, onFileSelected, onClear }: PhotoInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onFileSelected(file);
    // Permite volver a elegir el mismo archivo después de quitarlo
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  };

  const handleCapture = (file: File) => {
    setIsCameraOpen(false);
    onFileSelected(file);
  };

  let content: React.ReactNode;

  if (isCameraOpen) {
    content = <CameraCapture onCapture={handleCapture} onCancel={() => setIsCameraOpen(false)} />;
  } else if (photoUrl) {
    content = (
      <div className="flex flex-col gap-3">
        <img
          src={photoUrl}
          alt="Vista previa de tu foto"
          className="aspect-4/3 w-full rounded-lg border border-white/10 object-cover"
        />
        <button
          type="button"
          onClick={onClear}
          className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-transparent text-sm font-semibold text-(--text-h) hover:bg-white/5"
        >
          <RotateCcw size={16} aria-hidden="true" />
          Cambiar foto
        </button>
      </div>
    );
  } else {
    content = (
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center gap-4 rounded-lg border border-dashed px-6 py-10 text-center transition-colors ${
          isDragging ? 'border-(--accent) bg-(--accent-bg)' : 'border-white/20 bg-[#121212]'
        }`}
      >
        <ImagePlus size={36} className="text-(--accent)" aria-hidden="true" />
        <p className="text-sm text-(--text)">
          Arrastra una foto aquí o elige una opción. Usa una foto de frente, con buena luz y sin gorra ni lentes.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border-none bg-(--accent) px-5 text-sm font-bold uppercase text-black"
          >
            <Upload size={16} aria-hidden="true" />
            Subir foto
          </button>
          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-(--accent-border) bg-transparent px-5 text-sm font-bold uppercase text-(--accent) hover:bg-(--accent-bg)"
          >
            <Camera size={16} aria-hidden="true" />
            Usar cámara
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-(--labels)">Tu foto</span>
      {content}
      {error && (
        <p className="text-sm text-[#ff4d4d]" role="alert">
          {error}
        </p>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
    </div>
  );
}
