import { Outlet, useLocation } from 'react-router-dom';

/** Refresh / first load: no animation; SPA navigation: `location.key` !== default. */
function useSkipFirstRouteEnterAnimation() {
  const { key } = useLocation();
  return !key || key.toLowerCase() === 'default';
}

/** Same key for all `/admin/*` so the shell does not remount on every sub-route. */
function routeTransitionKey(pathname: string) {
  if (pathname.startsWith('/admin')) return '/admin';
  return pathname;
}

/** Route transition — disabled under `/admin` (animations live in AdminLayout). */
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
