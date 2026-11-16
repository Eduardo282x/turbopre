import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <p className="text-sm font-semibold text-muted-foreground">404</p>
          <CardTitle className="text-xl">Página no encontrada</CardTitle>
          <CardDescription>La ruta que buscas no existe o fue movida.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/">Volver al inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
