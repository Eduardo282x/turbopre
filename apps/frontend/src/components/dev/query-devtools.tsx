import { lazy, Suspense } from 'react';

const Devtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((module) => ({ default: module.ReactQueryDevtools })),
    )
  : null;

/** Devtools de TanStack Query, cargadas solo en desarrollo (chunk aparte). */
export function QueryDevtools() {
  if (!Devtools) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <Devtools initialIsOpen={false} buttonPosition="bottom-left" />
    </Suspense>
  );
}
