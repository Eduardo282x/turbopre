import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { QueryDevtools } from '@/components/dev/query-devtools';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { queryClient } from '@/lib/query-client';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {children}
        <Toaster position="top-right" richColors />
      </TooltipProvider>
      <QueryDevtools />
    </QueryClientProvider>
  );
}
