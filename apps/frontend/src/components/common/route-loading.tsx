import { Loader2 } from 'lucide-react';

export function RouteLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-sm">Cargando módulo…</p>
      </div>
    </div>
  );
}
