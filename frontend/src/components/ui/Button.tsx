import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  icon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-purple-600 text-white hover:bg-purple-500 active:bg-purple-700 shadow-sm shadow-purple-950/50 focus-visible:ring-purple-500 border border-purple-500/30',
  secondary:
    'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 active:bg-zinc-800/90 border border-zinc-700/80 focus-visible:ring-zinc-400',
  danger:
    'bg-red-500/15 text-red-400 hover:bg-red-500/25 active:bg-red-500/30 border border-red-500/30 focus-visible:ring-red-500',
  ghost:
    'bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 active:bg-zinc-800 focus-visible:ring-zinc-500 border border-transparent',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1 text-xs rounded-md gap-1.5',
  md: 'px-3.5 py-1.5 text-sm rounded-lg gap-2',
  lg: 'px-4.5 py-2.5 text-base rounded-lg gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  children,
  icon,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950
        active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}`}
      {...rest}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
