import { useState } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import eyeOpenIcon from '../assets/icons/show.png';
import eyeClosedIcon from '../assets/icons/hide.png';
import styles from '../styles/loginStyle.module.css';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  registerProps: UseFormRegisterReturn;
}

export function InputField({ label, error, registerProps, id, type, ...rest }: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={styles.formGroup}>
      <label htmlFor={id}>{label}</label>
      
      <div className={styles.inputWrapper}>
        <input
          id={id}
          type={inputType}
          className={`${error ? styles.inputError : ''} ${isPassword ? styles.inputPassword : ''}`}
          {...registerProps}
          {...rest}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={styles.passwordToggleBtn}
            tabIndex={-1}
          >
            <img 
              src={showPassword ? eyeClosedIcon : eyeOpenIcon} 
              alt={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} 
              className={styles.eyeIcon}
            />
          </button>
        )}
      </div>

      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}