import { LoginFormContainer } from '../containers/LoginContainer';
import mrBarberLogo from '../assets/logos/MrBarberLogo.webp';

function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <img
        src={mrBarberLogo}
        alt="Logo MrBarber"
        className="mb-[15px] h-auto w-[120px]"
      />

      <section className="box-border flex w-full max-w-[26.5rem] max-h-[34rem] flex-col items-center gap-5 rounded-2xl border border-[#2c2c2c] bg-[#1E1E1E] px-[33px] py-8">
        <h2 className="m-0 text-[29px] font-semibold uppercase text-[var(--text-h)]">
          Bienvenido
        </h2>
        <p className="m-0 text-lg font-semibold text-[var(--text)]">
          Inicia sesión para ver tu cuenta
        </p>

        <LoginFormContainer />
      </section>
    </div>
  );
}

export default LoginPage;