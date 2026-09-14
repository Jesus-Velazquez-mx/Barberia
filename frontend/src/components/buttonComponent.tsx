import styles from '../styles/loginStyle.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
}

export function Button({ children, isLoading, loadingText, className = '', ...rest }: ButtonProps) {
  return (
    <button 
      className={`${styles.loginButton} ${className}`} 
      disabled={isLoading || rest.disabled} 
      {...rest}
    >
      {isLoading ? loadingText : children}
    </button>
  );
}