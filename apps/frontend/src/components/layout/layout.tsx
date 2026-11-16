import { useEffect, useState } from 'react';
import { Outlet } from 'react-router';
import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';

const STORAGE_KEY = 'turbopre.sidebar';

export function Layout() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(STORAGE_KEY) === 'collapsed';
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? 'collapsed' : 'expanded');
  }, [collapsed]);

  return (
    <div className="flex min-h-svh bg-background">
      <AppSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        className="no-print sticky top-0 hidden lg:flex"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader collapsed={collapsed} onToggleCollapse={() => setCollapsed((value) => !value)} />
        <main className="flex-1 px-4 py-5 md:px-6 md:py-6">
          <div className="mx-auto w-full max-w-[1500px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
