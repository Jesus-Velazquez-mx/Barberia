import abelImg from '../../assets/images/team-abel.webp';
import julianImg from '../../assets/images/team-julian.webp';
import kevinImg from '../../assets/images/team-kevin.webp';

const TEAM = [
  {
    name: 'Abel Ramos',
    description: 'Barbero con más de 7 años perfeccionando el corte clásico a tijera.',
    image: abelImg,
  },
  {
    name: 'Julian Francisco',
    description: 'Experto en rebajado con navaja tradicional y cuidado de barba.',
    image: julianImg,
  },
  {
    name: 'Kevin Jasiel',
    description: 'Enfocado en estilismo moderno, degradados limpios y asesoría de imagen.',
    image: kevinImg,
  },
];

export function Team() {
  return (
    <section id="personal" className="bg-[#141414] px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
            Maestría y tradición
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
            Conoce a nuestro equipo
          </h2>
          <p className="mt-3 text-sm text-neutral-400">
            Profesionales apasionados por el detalle y el arte de la barbería clásica.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((member) => (
            <div
              key={member.name}
              className="overflow-hidden rounded-2xl border border-[#2c2c2c] bg-[#1a1a1a] transition-all duration-300 hover:border-[var(--accent)] hover:shadow-[0_0_24px_rgba(210,172,102,0.35)]"
            >
              <img src={member.image} alt={member.name} className="h-115 w-full object-cover" />
              <div className="p-5 text-center">
                <h3 className="text-base font-bold text-white">{member.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-400">
                  {member.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
