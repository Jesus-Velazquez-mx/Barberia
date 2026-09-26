import { Link } from 'react-router-dom';
import heroImage from '../../assets/images/hero-barbershop.webp';

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative flex min-h-[560px] items-center justify-center overflow-hidden px-6 py-42 text-center"
    >
      <div
        className="absolute inset-0 scale-[1.0] bg-cover bg-[center_40%] blur-[5px]"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-[#141414]/70" />

      <div className="relative z-10 mx-auto max-w-3xl">
        <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl md:text-6xl">
          Atención de primer nivel.
          <br />
          Resultados <span className="text-[var(--accent)]">impecables.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-neutral-300 sm:text-lg">
          Reserva tu cita con nuestros maestros barberos en segundos.
        </p>
        <Link
          to="/login"
          className="mt-8 inline-block rounded-lg bg-[var(--accent)] px-8 py-3 text-sm font-semibold text-[#141414] transition-all duration-200 hover:bg-[#B8924A] hover:shadow-[0_0_18px_rgba(210,172,102,0.6)]"
        >
          Agendar Cita
        </Link>
      </div>
    </section>
  );
}
