import { MapPin, Clock, Phone, Map } from 'lucide-react';

interface Branch {
  name: string;
  status: 'Abierto' | 'Próximamente';
  address: string;
  schedule: string;
  phone: string;
  ctaLabel: string;
  /* TODO: reemplazar '#' por el link real de Google Maps de cada sucursal. */
  mapsUrl: string;
}

const BRANCHES: Branch[] = [
  {
    name: 'Mr. Barber Sendero',
    status: 'Abierto',
    address: 'Blvd. José Limón #2545, Local F-04, Plaza Sendero, Culiacán.',
    schedule: 'Lun a Dom: 10:00 AM – 8:00 PM',
    phone: '+52 667 170 3681',
    ctaLabel: 'Cómo llegar',
    mapsUrl: 'https://maps.app.goo.gl/ypzVoUiFx1ohBNqBA'
  },
  {
    name: 'Mr. Barber Explanada',
    status: 'Abierto',
    address: 'Plaza Explanada Culiacán, Las Flores',
    schedule: 'Lun a Dom: 10:00 AM – 8:00 PM',
    phone: '+52 667 170 6045',
    ctaLabel: 'Cómo llegar',
    mapsUrl: 'https://maps.app.goo.gl/K5VSCNN2WkeJ1tgV6'
  },
  {
    name: 'Mr. Barber La Gran Plaza',
    status: 'Próximamente',
    address: 'Av. Vallarta #3959, Local K-12, La Gran Plaza Fashion Mall, Zapopan/GDL.',
    schedule: 'Gran Apertura: Enero 2027',
    phone: '+52 333 120 4580',
    ctaLabel: 'Ver ubicación en mapa',
    mapsUrl: 'https://maps.app.goo.gl/LyAera56jKCNaYiH6'
  }
];

function BranchCard({ branch }: { branch: Branch }) {
  const isOpen = branch.status === 'Abierto';

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 transition-all duration-300 hover:border-[var(--accent)] hover:shadow-[0_0_24px_rgba(210,172,102,0.35)]">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">{branch.name}</h3>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isOpen ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-400/15 text-blue-400'
          }`}
        >
          {branch.status}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3 text-sm text-neutral-400">
        <p className="flex items-start gap-2">
          <MapPin size={16} className="mt-0.5 shrink-0 text-[var(--accent)]" />
          {branch.address}
        </p>
        <p className="flex items-center gap-2">
          <Clock size={16} className="shrink-0 text-[var(--accent)]" />
          {branch.schedule}
        </p>
        <p className="flex items-center gap-2">
          <Phone size={16} className="shrink-0 text-[var(--accent)]" />
          {branch.phone}
        </p>
      </div>

      <div className="flex-1" />

      <a
        href={branch.mapsUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-5 flex items-center justify-center gap-2 rounded-full bg-white/5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[var(--accent)] hover:text-[#141414]"
      >
        <Map size={16} />
        {branch.ctaLabel}
      </a>
    </div>
  );
}

export function Locations() {
  return (
    <section id="ubicacion" className="bg-[#141414] px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">Ubicación y contacto</p>
          <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">Nuestras sucursales</h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {BRANCHES.map((branch) => (
            <BranchCard key={branch.name} branch={branch} />
          ))}
        </div>
      </div>
    </section>
  );
}
