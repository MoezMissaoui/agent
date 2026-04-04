type FormFeedbackProps = {
  variant: 'success' | 'error';
  /** When empty, nothing is rendered. */
  message: string | null | undefined;
  className?: string;
};

/**
 * Inline feedback for forms: place after fields, immediately before the submit button.
 * Success styling matches the “Password set successfully” banner (border + tinted background).
 */
export function FormFeedback({ variant, message, className = '' }: FormFeedbackProps) {
  if (!message?.trim()) {
    return null;
  }
  const styles =
    variant === 'success'
      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200'
      : 'border-red-500/25 bg-red-500/10 text-red-800 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-200';
  return (
    <p
      className={`rounded-xl border px-3 py-2.5 text-sm ${styles} ${className}`}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      {message}
    </p>
  );
}
