import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
};

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  children,
  ...rest
}: Props) {
  const base =
    'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50';
  const styles =
    variant === 'primary'
      ? 'bg-primary text-white shadow-sm hover:brightness-110 active:brightness-95'
      : 'text-primary hover:bg-primary/10';
  return (
    <button type={type} className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}
