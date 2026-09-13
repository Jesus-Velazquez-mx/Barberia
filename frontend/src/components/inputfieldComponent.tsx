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
      
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          id={id}
          type={inputType}
          className={error ? styles.inputError : undefined}
          style={{ paddingRight: isPassword ? '2.5rem' : '10px' }}
          {...registerProps}
          {...rest}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0',
            }}
            tabIndex={-1}
          >
            <img 
              src={showPassword ? eyeClosedIcon : eyeOpenIcon} 
              alt={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} 
              style={{ width: '20px', height: '20px' }}
            />
          </button>
        )}
      </div>

      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}