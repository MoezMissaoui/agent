import { Outlet, useLocation } from 'react-router-dom';

/** Refresh / première entrée : pas d’animation ; navigation SPA : `location.key` ≠ default. */
function useSkipFirstRouteEnterAnimation() {
  const { key } = useLocation();
  return !key || key.toLowerCase() === 'default';
}

/** Même clé pour tout `/admin/*` pour ne pas remonter le shell à chaque sous-page. */
function routeTransitionKey(pathname: string) {
  if (pathname.startsWith('/admin')) return '/admin';
  return pathname;
}

/** Transition de route — désactivée sous `/admin` (animations dans AdminLayout). */
export function AnimatedLayout() {
  const location = useLocation();
  const skipEnter = useSkipFirstRouteEnterAnimation();
  const isAdmin = location.pathname.startsWith('/admin');
  const animatePage = !skipEnter && !isAdmin;

  return (
    <div
      key={routeTransitionKey(location.pathname)}
      className={animatePage ? 'min-h-[100dvh] animate-page-enter' : 'min-h-[100dvh]'}
    >
      <Outlet />
    </div>
  );
}
