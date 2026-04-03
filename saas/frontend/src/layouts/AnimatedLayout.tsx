import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import { pageTransition } from '../lib/motion-presets';

/** Première entrée (refresh) : pas d’opacity 0 ; navigation client : autre `location.key`. */
function useSkipFirstRouteEnterAnimation() {
  const { key } = useLocation();
  return !key || key.toLowerCase() === 'default';
}

/** Enveloppe les pages : fondu + léger décalage vertical entre les routes (animation lente et fluide). */
export function AnimatedLayout() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const t = pageTransition(reduceMotion);
  const skipEnter = useSkipFirstRouteEnterAnimation();

  const initial =
    reduceMotion || skipEnter ? false : { opacity: 0, y: 12 };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={initial}
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
