import { LoginFormContainer } from '../containers/LoginContainer';
import styles from '../styles/loginStyle.module.css';

function LoginPage() {
  return (
    <div className={styles.loginWrapper}>
      <img
        src="/src/assets/logos/MrBarberLogo.png"
        alt="Logo MrBarber"
        className={styles.logo}
      />

      <section className={styles.loginContainer}>
        <h2 className={styles.title}>Bienvenido de nuevo</h2>
        <p className={styles.loginSubtitle}>Inicia sesión para ver tu cuenta</p>

        <LoginFormContainer />
      </section>
    </div>
  );
}

export default LoginPage;