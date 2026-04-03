import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import { pageTransition } from '../lib/motion-presets';

/** Enveloppe les pages : fondu + léger décalage vertical entre les routes (animation lente et fluide). */
export function AnimatedLayout() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const t = pageTransition(reduceMotion);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
        transition={t}
        className="min-h-[100dvh]"
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}
