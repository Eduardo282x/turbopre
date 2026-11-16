import { useTheme } from '@/app/theme-context';
import { Toaster } from '@/components/ui/sonner';

export function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster position="top-right" theme={resolvedTheme === 'dark' ? 'dark' : 'light'} richColors closeButton />;
}
