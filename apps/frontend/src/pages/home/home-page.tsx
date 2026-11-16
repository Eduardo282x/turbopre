import { useQuery } from '@tanstack/react-query';
import { LuCheck, LuCopy, LuRefreshCw } from 'react-icons/lu';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/formatters';
import { healthService } from '@/services/health/health.service';
import { useAuthStore } from '@/stores/use-auth-store';

const stack = [
  'Vite 8',
  'React 19',
  'TypeScript',
  'Tailwind CSS 4',
  'shadcn/ui',
  'React Router 8',
  'TanStack Query',
  'Zustand',
  'Axios',
  'React Hook Form',
  'Zod',
  'NestJS 12',
  'Prisma 7',
  'Turborepo',
];

export function HomePage() {
  const user = useAuthStore((state) => state.user);
  const health = useQuery({
    queryKey: ['health'],
    queryFn: healthService.check,
    refetchInterval: 30_000,
  });

  const copyToken = async () => {
    const token = useAuthStore.getState().accessToken;

    if (!token) {
      return;
    }

    await navigator.clipboard.writeText(token);
    toast.success('Token copiado al portapapeles');
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">
          Hola{user ? `, ${user.name.split(' ')[0]}` : ''} 👋
        </h2>
        <p className="text-sm text-muted-foreground">
          Esta pantalla consume la API real a través del proxy de Vite.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-base">
              Estado de la API
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Volver a consultar"
                onClick={() => void health.refetch()}
              >
                <LuRefreshCw className={health.isFetching ? 'animate-spin' : undefined} />
              </Button>
            </CardTitle>
            <CardDescription>GET /api/health</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {health.isPending && (
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            )}

            {health.isError && (
              <div className="space-y-2 text-sm">
                <Badge variant="destructive">Sin conexión</Badge>
                <p className="text-muted-foreground">
                  No se pudo contactar con la API. Ejecuta <code className="rounded bg-muted px-1">pnpm dev</code> y
                  asegúrate de que el backend escucha en el puerto 3000.
                </p>
              </div>
            )}

            {health.data && (
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge className="gap-1">
                    <LuCheck className="size-3" /> {health.data.status}
                  </Badge>
                  <span className="text-muted-foreground">{health.data.service}</span>
                </div>
                <Separator />
                <dl className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <dt>Versión</dt>
                  <dd className="text-right font-medium text-foreground">{health.data.version}</dd>
                  <dt>Uptime</dt>
                  <dd className="text-right font-medium text-foreground">{health.data.uptime}s</dd>
                  <dt>Última respuesta</dt>
                  <dd className="text-right font-medium text-foreground">
                    {formatDateTime(health.data.timestamp)}
                  </dd>
                </dl>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tu sesión</CardTitle>
            <CardDescription>Estado guardado en zustand + localStorage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <dl className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Nombre</dt>
                <dd className="font-medium">{user?.name}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Correo</dt>
                <dd className="font-medium">{user?.email}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Rol</dt>
                <dd>
                  <Badge variant="secondary">{user?.role}</Badge>
                </dd>
              </div>
            </dl>
            <Separator />
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                El interceptor de Axios adjunta el token en cada petición.
              </p>
              <Button variant="outline" size="sm" onClick={() => void copyToken()}>
                <LuCopy /> Copiar token
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stack del monorepo</CardTitle>
          <CardDescription>
            apps/frontend · apps/backend · packages/shared, orquestados por Turborepo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {stack.map((item) => (
            <Badge key={item} variant="outline">
              {item}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
