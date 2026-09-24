interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
}

export function Button({ children, isLoading, loadingText, className = '', ...rest }: ButtonProps) {
  return (
    <button
      className={`h-10 cursor-pointer rounded-lg border-none bg-[var(--accent)] font-bold uppercase text-black ${className}`}
      disabled={isLoading || rest.disabled}
      {...rest}
    >
      {isLoading ? loadingText : children}
    </button>
  );
}
