import aboutImage from '../../assets/images/about-barbershop.webp';

const STATS = [
  { value: '+4', label: 'Años de Experiencia' },
  { value: '+15K', label: 'Servicios realizados' },
  { value: '100%', label: 'Garantía de satisfacción' },
];

export function About() {
  return (
    <section id="sobre-nosotros" className="bg-[#141414] px-6 py-18">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <img
          src={aboutImage}
          alt="Interior de la barbería"
          className="h-[420px] w-full rounded-2xl object-cover object-[center_80%] lg:h-[700px]"
        />

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
            Tradición y vanguardia
          </p>
          <h2 className="mt-2 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
            Más que un corte, una experiencia de tradición.
          </h2>

          <p className="mt-5 text-sm leading-relaxed text-neutral-400">
            En Mr. Barber, entendemos el cuidado personal como un ritual de
            bienestar y confianza. Con dos sucursales en la ciudad de
            Culiacán, Sinaloa y un equipo de 22 profesionales apasionados,
            fusionamos la precisión de las técnicas tradicionales de navaja
            libre con las tendencias más vanguardistas, garantizando un
            servicio integral de la más alta calidad en cada visita.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-neutral-400">
            Nuestro propósito es consolidarnos como el referente estrella de
            la barbería en el estado, aportando una perspectiva actual,
            exclusiva y cercana. Creamos un espacio donde el tiempo se
            detiene y la atención al detalle es absoluta, logrando que cada
            cliente no solo luzca impecable, sino que se sienta
            genuinamente valorado.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4 border-t border-[var(--accent)]/30 pt-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-extrabold text-[var(--accent)] sm:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-neutral-400 sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
