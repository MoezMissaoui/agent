import { Outlet, useLocation } from 'react-router-dom';

/** Refresh / première entrée : pas d’animation ; navigation SPA : `location.key` ≠ default. */
function useSkipFirstRouteEnterAnimation() {
  const { key } = useLocation();
  return !key || key.toLowerCase() === 'default';
}

/** Transition de route en CSS (`animation-fill-mode: both` → pas de flash avant l’anim). */
export function AnimatedLayout() {
  const location = useLocation();
  const skipEnter = useSkipFirstRouteEnterAnimation();

  return (
    <div
      key={location.pathname}
      className={
        skipEnter ? 'min-h-[100dvh]' : 'min-h-[100dvh] animate-page-enter'
      }
    >
      <Outlet />
    </div>
  );
}
