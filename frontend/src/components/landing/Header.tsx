import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import mrBarberLogo from '../../assets/logos/MrBarberLogo.webp';

const NAV_LINKS = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Sobre Nosotros', href: '#sobre-nosotros' },
  { label: 'Personal', href: '#personal' },
  { label: 'Galería', href: '#galeria' },
  { label: 'Ubicación y Contacto', href: '#ubicacion' }
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#141414]/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center gap-10 px-6 py-4">
        <a href="#inicio" className="flex items-center gap-2">
          <img src={mrBarberLogo} alt="Mr. Barber" className="h-9 w-9" />
        </a>

        <ul className="hidden items-center gap-8 text-sm text-neutral-300 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="transition-colors duration-200 hover:text-[var(--accent)] hover:underline hover:underline-offset-4"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <Link
          to="/login"
          className="ml-auto hidden items-center gap-1.5 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[#141414] transition-all duration-200 hover:bg-[#B8924A] hover:shadow-[0_0_16px_rgba(210,172,102,0.55)] lg:inline-flex"
        >
          Comenzar <ArrowRight size={16} />
        </Link>

        <button onClick={() => setOpen((v) => !v)} className="ml-auto text-white lg:hidden" aria-label="Abrir menú">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/5 bg-[#141414] px-6 pb-6 lg:hidden">
          <ul className="flex flex-col gap-4 pt-4 text-sm text-neutral-300">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block transition-colors duration-200 hover:text-[var(--accent)] hover:underline hover:underline-offset-4"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="mt-5 flex items-center justify-center gap-1.5 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-center text-sm font-semibold text-[#141414] transition-all duration-200 hover:bg-[#B8924A] hover:shadow-[0_0_16px_rgba(210,172,102,0.55)]"
          >
            Comenzar <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </header>
  );
}
