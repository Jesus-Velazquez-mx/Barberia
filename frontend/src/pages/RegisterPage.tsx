import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { RegisterFormContainer } from '../containers/RegisterContainer';
import mrBarberLogo from '../assets/logos/MrBarberLogo.webp';

function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-10">
      <div className="relative w-full max-w-[26.5rem]">
        <Link
          to="/"
          aria-label="Volver a la página principal"
          className="absolute left-0 top-0 text-white transition-colors duration-200 hover:text-[var(--accent)]"
        >
          <ArrowLeft size={24} />
        </Link>

        <Link to="/" className="mx-auto mb-[15px] block w-[120px]">
          <img src={mrBarberLogo} alt="Logo MrBarber" className="h-auto w-[120px]" />
        </Link>

        <section className="box-border flex w-full flex-col items-center gap-5 rounded-2xl border border-[#2c2c2c] bg-[#1E1E1E] px-[33px] py-8">
          <h2 className="m-0 text-[29px] font-semibold uppercase text-[var(--text-h)]">Bienvenido</h2>
          <p className="m-0 text-lg font-semibold text-[var(--text)]">Crea tu cuenta aquí</p>

          <RegisterFormContainer />
        </section>
      </div>
    </div>
  );
}

export default RegisterPage;
