import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { noticeTransition } from '../../lib/motion-presets';

const variantClass: Record<'error' | 'warning', string> = {
  error:
    'rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300',
  warning:
    'rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100',
};

type Props = {
  show: boolean;
  variant: 'error' | 'warning';
  children: ReactNode;
  /** Clé stable pour ré-animer quand le contenu change (ex. nouveau message d’erreur). */
  contentKey?: string;
};

/** Message d’erreur / alerte avec apparition et disparition douces. */
export function AnimatedNotice({ show, variant, children, contentKey }: Props) {
  const reduceMotion = useReducedMotion();
  const t = noticeTransition(reduceMotion);

  return (
    <AnimatePresence mode="wait">
      {show ? (
        <motion.div
          key={contentKey ?? 'notice'}
          role="alert"
          initial={reduceMotion ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
          transition={t}
          className={variantClass[variant]}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
