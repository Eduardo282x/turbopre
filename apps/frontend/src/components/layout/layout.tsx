import { Outlet } from 'react-router';
import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';

export function Layout() {
  return (
    <div className="flex min-h-svh bg-muted/20">
      <AppSidebar className="sticky top-0 hidden lg:flex" />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
