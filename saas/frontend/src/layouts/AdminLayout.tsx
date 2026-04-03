import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAuth } from '../hooks/useAuth';
import { appInitial, appName } from '../lib/brand';

const navItems = [
  { to: '/admin', end: true, label: 'Dashboard' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/api-keys', label: 'API keys' },
  { to: '/admin/settings', label: 'Settings' },
] as const;

function IconMenu(props: { className?: string }) {
  return (
    <svg className={props.className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function IconX(props: { className?: string }) {
  return (
    <svg className={props.className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function IconDashboard(props: { className?: string }) {
  return (
    <svg className={props.className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
    </svg>
  );
}

function IconUsers(props: { className?: string }) {
  return (
    <svg className={props.className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function IconKey(props: { className?: string }) {
  return (
    <svg className={props.className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

function IconSettings(props: { className?: string }) {
  return (
    <svg className={props.className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

const navIcon = [IconDashboard, IconUsers, IconKey, IconSettings] as const;

const SIDEBAR_COLLAPSED_KEY = 'synapse-admin-sidebar-collapsed';

function readSidebarCollapsed(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

function IconChevronDown(props: { className?: string }) {
  return (
    <svg className={props.className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/** Bascule replier / déplier la sidebar (desktop). */
function IconSidebarToggle(props: { collapsed: boolean; className?: string }) {
  return (
    <svg
      className={`${props.className ?? ''} transition-transform duration-200 ${props.collapsed ? 'rotate-180' : ''}`}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => readSidebarCollapsed());
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener('pointerdown', handlePointerDown);
      return () => document.removeEventListener('pointerdown', handlePointerDown);
    }
  }, [profileOpen]);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed]);

  return (
    <div className="flex min-h-[100dvh] bg-surface dark:bg-surface-dark">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-[transform,width] duration-200 md:static md:z-0 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${sidebarCollapsed ? 'md:w-[4.5rem]' : 'md:w-64'}`}
      >
        <div className="admin-sidebar-enter flex h-full w-full min-w-0 flex-col border-r border-slate-200/90 bg-white dark:border-slate-700/80 dark:bg-slate-900">
          <div
            className={`flex h-14 shrink-0 items-center gap-2 border-b border-slate-200/90 px-4 dark:border-slate-700/80 md:h-16 ${
              sidebarCollapsed ? 'justify-between md:justify-center md:px-2' : 'justify-between md:px-5'
            }`}
          >
            <Link
              to="/admin"
              className={`flex min-w-0 items-center gap-2 text-primary transition hover:opacity-90 ${
                sidebarCollapsed ? 'md:justify-center' : ''
              }`}
              onClick={() => setMobileOpen(false)}
              title={sidebarCollapsed ? appName : undefined}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary dark:bg-primary/20">
                {appInitial}
              </span>
              <span
                className={`truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-white ${
                  sidebarCollapsed ? 'md:hidden' : ''
                }`}
              >
                {appName}
              </span>
            </Link>
            <button
              type="button"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
              aria-label="Fermer"
              onClick={() => setMobileOpen(false)}
            >
              <IconX />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-3">
            {navItems.map((item, i) => {
              const Icon = navIcon[i];
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={'end' in item ? item.end : false}
                  title={sidebarCollapsed ? item.label : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-xl py-2.5 text-sm font-medium transition ${
                      sidebarCollapsed ? 'md:justify-center md:px-2' : 'px-3'
                    } ${
                      isActive
                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80'
                    }`
                  }
                >
                  <Icon className="size-5 shrink-0 opacity-90" />
                  <span className={sidebarCollapsed ? 'md:sr-only' : ''}>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <button
            type="button"
            className="hidden shrink-0 items-center justify-center border-t border-slate-200/90 py-3 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700/80 dark:text-slate-400 dark:hover:bg-slate-800/80 md:flex"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setSidebarCollapsed((c) => !c)}
          >
            <IconSidebarToggle collapsed={sidebarCollapsed} className="text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </aside>

      <div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 animate-admin-topbar items-center justify-between gap-4 overflow-visible border-b border-slate-200/90 bg-white/90 px-4 backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/90 md:h-16 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
              aria-label="Ouvrir le menu"
              onClick={() => setMobileOpen(true)}
            >
              <IconMenu />
            </button>
            <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">Control Plane</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                aria-label="Account menu"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/80 px-2 py-1.5 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/80 dark:hover:bg-slate-800"
                onClick={() => setProfileOpen((o) => !o)}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary dark:bg-primary/20">
                  {user?.email?.charAt(0).toUpperCase() ?? '?'}
                </span>
                <IconChevronDown className={`shrink-0 text-slate-500 transition dark:text-slate-400 ${profileOpen ? '-rotate-180' : ''}`} />
              </button>
              {profileOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[200px] rounded-xl border border-slate-200/90 bg-white py-1 shadow-lg dark:border-slate-700/80 dark:bg-slate-900"
                >
                  <p className="truncate border-b border-slate-100 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    {user?.email}
                  </p>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-3 py-2.5 text-left text-sm text-slate-800 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                  >
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div key={pathname} className="animate-admin-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
