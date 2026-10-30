import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  /* Si es false, hacer clic fuera del modal (en el fondo) no lo cierra */
  closeOnOutsideClick?: boolean;
}

const RESIZE_DURATION_MS = 250;

export function Modal({ isOpen, onClose, children, className = '', closeOnOutsideClick = true }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastHeightRef = useRef<number | null>(null);
  const animationRef = useRef<Animation | null>(null);

  // Anima la altura del modal cuando el contenido hace que crezca o se encoja.
  // Se mide la altura natural (auto) y se interpola desde la altura anterior, así el layout no se toca.
  const animateHeightChange = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      lastHeightRef.current = null;
      return;
    }

    const running = animationRef.current?.playState === 'running';
    const fromHeight = running ? dialog.getBoundingClientRect().height : lastHeightRef.current;

    animationRef.current?.cancel();
    animationRef.current = null;

    const toHeight = dialog.getBoundingClientRect().height;
    lastHeightRef.current = toHeight;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (fromHeight === null || prefersReducedMotion || Math.abs(fromHeight - toHeight) < 1) return;

    dialog.style.overflow = 'hidden';
    const animation = dialog.animate([{ height: `${fromHeight}px` }, { height: `${toHeight}px` }], {
      duration: RESIZE_DURATION_MS,
      easing: 'ease-in-out'
    });
    animationRef.current = animation;

    const cleanUp = () => {
      if (animationRef.current === animation) {
        animationRef.current = null;
        dialog.style.overflow = '';
      }
    };
    animation.onfinish = cleanUp;
    animation.oncancel = cleanUp;
  }, []);

  useLayoutEffect(() => {
    animateHeightChange();
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;

    // Cubre cambios de tamaño que no vuelven a renderizar el Modal (estado interno de los hijos).
    const observer = new ResizeObserver(() => {
      if (animationRef.current?.playState !== 'running') animateHeightChange();
    });
    observer.observe(dialog);

    return () => observer.disconnect();
  }, [isOpen, animateHeightChange]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={closeOnOutsideClick ? onClose : undefined}
      role="presentation"
    >
      {/* Los selectores [&_...] agrandan los InputField solo dentro de los modales, sin afectar login/registro */}
      <div
        ref={dialogRef}
        className={`w-full max-w-xl max-h-11/12 overflow-y-auto rounded-2xl border border-white/10 bg-[#1E1E1E] px-8 pt-8 shadow-(--shadow) [&_button]:text-base [&_h2]:text-2xl [&_input]:py-3.5 [&_input]:pl-4 [&_input]:text-base [&_input]:font-normal [&_label]:text-base [&_p]:text-base ${className}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}
