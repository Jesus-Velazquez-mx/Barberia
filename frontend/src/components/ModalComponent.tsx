import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, children, className = '' }: ModalProps) {
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
      onClick={onClose}
      role="presentation"
    >
      {/* Los selectores [&_...] agrandan los InputField solo dentro de los modales, sin afectar login/registro */}
      <div
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
