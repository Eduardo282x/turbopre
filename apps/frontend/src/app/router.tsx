import { createBrowserRouter } from 'react-router';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Layout } from '@/components/layout/layout';

export const router = createBrowserRouter([
  {
    path: '/login',
    lazy: async () => {
      const { LoginPage } = await import('@/pages/auth/login-page');
      return { Component: LoginPage };
    },
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            index: true,
            lazy: async () => {
              const { HomePage } = await import('@/pages/home/home-page');
              return { Component: HomePage };
            },
          },
          {
            path: 'ajustes',
            lazy: async () => {
              const { SettingsPage } = await import('@/pages/settings/settings-page');
              return { Component: SettingsPage };
            },
          },
        ],
      },
    ],
  },
  {
    path: '*',
    lazy: async () => {
      const { NotFoundPage } = await import('@/pages/not-found-page');
      return { Component: NotFoundPage };
    },
  },
]);
