import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';

export function ForbiddenPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-10">
      <PageHeader
        eyebrow="Acceso restringido"
        title="No tienes permiso para esta sección"
        description="Tu rol o área no tiene acceso al módulo solicitado. Puedes volver al centro de control o cambiar de usuario en modo preview."
      />
      <EmptyState
        icon={ShieldAlert}
        title="Permiso denegado"
        description="Si necesitas acceso, solicita la revisión de tu rol al Usuario Global."
        action={
          <Button asChild variant="outline">
            <Link to="/">
              <ArrowLeft /> Volver al centro de control
            </Link>
          </Button>
        }
      />
    </div>
  );
}
