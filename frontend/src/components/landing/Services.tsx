import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import corteImg from '../../assets/images/service-corte.webp';
import barbaImg from '../../assets/images/service-barba.webp';
import facialImg from '../../assets/images/service-facial.webp';
import tinteImg from '../../assets/images/service-tinte.webp';

const SERVICES = [
  {
    title: 'Corte moderno',
    description: 'Corte tradicional a tijera y máquina, incluye lavado y peinado.',
    duration: '45 Min',
    image: corteImg,
  },
  {
    title: 'Delineado de barba',
    description: 'Rebajado con máquina y delineado de contornos con navaja.',
    duration: '30 Min',
    image: barbaImg,
  },
  {
    title: 'Limpieza Facial',
    description: 'Gel limpiador, exfoliación mecánica y extracción manual de impurezas.',
    duration: '60 Min',
    image: facialImg,
  },
  {
    title: 'Tinte de cabello',
    description: 'Aplicación de color en el cabello, lavado y corrección de manchas.',
    duration: '80 Min',
    image: tinteImg,
  },
];

function ServiceCard({
  title,
  description,
  duration,
  image,
}: (typeof SERVICES)[number]) {
  return (
    <div className="group rounded-2xl border border-white/5 bg-[#1a1a1a] p-5 text-center transition-all duration-300 hover:border-[var(--accent)] hover:shadow-[0_0_24px_rgba(210,172,102,0.35)]">
      <div className="relative h-65 overflow-hidden rounded-xl">
        <img src={image} alt={title} className="h-full w-full object-cover" />
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs font-semibold text-[#141414]">
          <Clock size={12} />
          {duration}
        </span>
      </div>

      <h3 className="mt-5 text-base font-bold text-white transition-colors duration-300 group-hover:text-[var(--accent)]">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-400">{description}</p>

      <Link
        to="/login"
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[#141414] transition-all duration-200 hover:bg-[#B8924A] hover:shadow-[0_0_14px_rgba(210,172,102,0.55)]"
      >
        Agendar <ArrowRight size={14} />
      </Link>
    </div>
  );
}

export function Services() {
  return (
    <section id="servicios" className="bg-[#141414] px-6 py-14">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
            Experiencia y detalle
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
            Nuestros servicios
          </h2>
          <p className="mt-3 text-sm text-neutral-400">
            Técnicas tradicionales combinadas con tendencias modernas
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service) => (
            <ServiceCard key={service.title} {...service} />
          ))}
        </div>
      </div>
    </section>
  );
}
