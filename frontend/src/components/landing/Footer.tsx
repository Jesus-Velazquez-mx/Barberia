import { Link } from 'react-router-dom';
import { FacebookIcon, WhatsAppIcon, InstagramIcon } from './SocialIcons';
import mrBarberLogo from '../../assets/logos/MrBarberLogo.webp';

const NAV_LINKS = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Sobre Nosotros', href: '#sobre-nosotros' },
  { label: 'Personal', href: '#personal' },
  { label: 'Galería', href: '#galeria' },
  { label: 'Ubicación y Contacto', href: '#ubicacion' },
];

const SOCIALS = [
  { label: 'Facebook', Icon: FacebookIcon, href: '#' },
  { label: 'WhatsApp', Icon: WhatsAppIcon, href: '#' },
  { label: 'Instagram', Icon: InstagramIcon, href: '#' },
];

const linkHover =
  'transition-colors duration-200 hover:text-[var(--accent)] hover:underline hover:underline-offset-4';

export function Footer() {
  return (
    <footer className="bg-[#242426] px-6 pt-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div>
          <img src={mrBarberLogo} alt="Mr. Barber" className="h-14 w-14" />
          <h3 className="mt-3 text-lg font-bold text-white">Mr. Barber</h3>
          <p className="mt-2 max-w-[22ch] text-sm text-neutral-400">
            Rituales clásicos y técnicas modernas de cuidado masculino en Culiacán.
          </p>
          <div className="mt-4 flex items-center gap-3">
            {SOCIALS.map(({ label, Icon, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-neutral-300 transition-all duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <Icon width={16} height={16} />
              </a>
            ))}
          </div>
        </div>

        {/* Navegación */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
            Navegación
          </p>
          <ul className="mt-3 flex flex-col gap-2.5 text-sm text-neutral-300">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a href={link.href} className={linkHover}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Horarios */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
            Horarios
          </p>
          <p className="mt-3 text-sm font-semibold text-white">Lunes a Domingo</p>
          <p className="mt-1 text-sm text-neutral-400">10:00 AM - 8:00 PM</p>
          <a href="#ubicacion" className={`mt-1 inline-block text-sm text-[var(--accent)] ${linkHover}`}>
            Sendero &amp; Explanada
          </a>
        </div>

        {/* Reserva tu cita */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
            Reserva tu cita
          </p>
          <p className="mt-3 text-sm text-neutral-400">
            Atención personalizada con nuestros barberos.
          </p>
          <Link
            to="/login"
            className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[#141414] transition-all duration-200 hover:bg-[#B8924A] hover:shadow-[0_0_16px_rgba(210,172,102,0.55)]"
          >
            Agendar Cita
          </Link>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-xs text-neutral-500 sm:flex-row">
        <p>© {new Date().getFullYear()} Mr. Barber. Todos los derechos reservados.</p>
        <div className="flex items-center gap-5">
          <a href="#" className={linkHover}>
            Aviso de Privacidad
          </a>
          <a href="#" className={linkHover}>
            Términos del Servicio
          </a>
        </div>
      </div>
    </footer>
  );
}
