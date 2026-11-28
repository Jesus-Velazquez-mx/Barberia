import { ImageOff } from 'lucide-react';

interface HaircutStyleThumbnailProps {
  name: string;
  url?: string | null;
  size?: 'sm' | 'lg';
}

const SIZE_CLASSES = { sm: 'h-12 w-12', lg: 'h-32 w-32' };

/* Foto de un estilo de corte, o un marcador si no tiene. */
export function HaircutStyleThumbnail({ name, url, size = 'sm' }: HaircutStyleThumbnailProps) {
  const sizeClass = SIZE_CLASSES[size];

  if (!url) {
    return (
      <div
        className={`${sizeClass} flex shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#121212] text-[var(--text)]`}
        title="Sin foto"
      >
        <ImageOff size={size === 'sm' ? 18 : 28} aria-hidden="true" />
        <span className="sr-only">Sin foto</span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={`Foto del corte ${name}`}
      className={`${sizeClass} shrink-0 rounded-lg border border-white/10 object-cover`}
    />
  );
}
