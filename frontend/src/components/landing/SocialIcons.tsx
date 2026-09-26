import type { SVGProps } from 'react';

/* lucide-react quitó los íconos de marca (Facebook, Instagram, etc.) hace
   varias versiones, así que estos tres viven aquí como SVGs propios en el
   mismo estilo (stroke, 24x24) para no depender de esa librería para ellos. */

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

/* Genérico (burbuja + teléfono), no el logotipo exacto de WhatsApp,
   para no reproducir la marca registrada tal cual. */
export function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 11.5a8.5 8.5 0 0 1-11.8 7.82L3 21l1.68-6.2A8.5 8.5 0 1 1 21 11.5z" />
      <path d="M9 10.5c0 3 2.5 5 5 5" />
    </svg>
  );
}
