import { MapPin, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import plano from '@/assets/brand/plano.jpg';
import { RouteStatusBadge } from '@/components/common/badges';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { SectionCard } from '@/components/common/section-card';
import { Badge } from '@/components/ui/badge';
import { AREA_BY_ID } from '@/features/preview/config';
import { getRoutesWithRelations } from '@/features/preview/store/selectors';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { AreaId, RouteSheetWithRelations } from '@/features/preview/types';
import { daysUntil } from '@/lib/formatters';

interface Zone {
  id: string;
  name: string;
  top: string;
  left: string;
  color: string;
  areas: AreaId[];
}

const ZONES: Zone[] = [
  { id: 'generators', name: 'Generadores', top: '28%', left: '58%', color: '#eab308', areas: ['generators'] },
  { id: 'turbines', name: 'Turbinas', top: '33%', left: '23%', color: '#f97316', areas: ['turbines'] },
  { id: 'machining', name: 'Mecanizado', top: '45%', left: '34%', color: '#3b82f6', areas: ['machining'] },
  { id: 'welding', name: 'Soldadura', top: '45%', left: '50%', color: '#22c55e', areas: ['welding'] },
  { id: 'quality', name: 'Calidad / Ingeniería', top: '62%', left: '23%', color: '#ec4899', areas: ['quality', 'engineering', 'planning'] },
  { id: 'workshop', name: 'Taller', top: '55%', left: '62%', color: '#14b8a6', areas: ['workshop'] },
  { id: 'warehouse', name: 'Almacén', top: '22%', left: '75%', color: '#ef4444', areas: ['warehouse'] },
];

function routeZone(route: RouteSheetWithRelations): Zone | undefined {
  const currentPhase =
    route.phases.find((phase) => phase.status === 'IN_PROGRESS') ??
    route.phases.find((phase) => phase.status === 'PENDING');
  if (!currentPhase) return undefined;
  return ZONES.find((zone) => zone.areas.includes(currentPhase.areaId));
}

function alertColor(route: RouteSheetWithRelations): string {
  const days = daysUntil(route.dueDate);
  if (days < 0 || route.priority === 'CRITICAL') return '#ff4d5e';
  if (days <= 3) return '#ffb020';
  return '#22c55e';
}

export function PlantMapPage() {
  const db = usePreviewStore((state) => state.db);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const activeRoutes = getRoutesWithRelations(db).filter((route) =>
    ['APPROVED', 'IN_PROGRESS', 'IN_QUALITY'].includes(route.status),
  );

  const byZone = new Map<string, RouteSheetWithRelations[]>();
  activeRoutes.forEach((route) => {
    const zone = routeZone(route);
    if (!zone) return;
    const list = byZone.get(zone.id) ?? [];
    list.push(route);
    byZone.set(zone.id, list);
  });

  const selectedRoutes = selectedZone ? byZone.get(selectedZone) ?? [] : [];
  const selectedZoneInfo = ZONES.find((zone) => zone.id === selectedZone);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Análisis"
        title="Mapa de planta"
        description="Ubicación física aproximada de las hojas de ruta activas según el área de su fase actual."
      />

      <SectionCard
        title="Plano general TurboPre"
        description="Haz clic en un punto para ver los equipos ubicados en esa área."
        actions={
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-success" /> Al día</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-warning" /> Próximo a vencer</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-destructive" /> Crítico</span>
          </div>
        }
      >
        <div className="overflow-hidden rounded-xl border border-border bg-[#070b10]">
          <div className="relative w-full">
            <img src={plano} alt="Plano de la planta TurboPre" className="w-full opacity-90" />
            {ZONES.map((zone) => {
              const routes = byZone.get(zone.id) ?? [];
              if (routes.length === 0) return null;
              const critical = routes.some((route) => alertColor(route) === '#ff4d5e');
              const warning = routes.some((route) => alertColor(route) === '#ffb020');
              const color = critical ? '#ff4d5e' : warning ? '#ffb020' : zone.color;
              return (
                <button
                  key={zone.id}
                  type="button"
                  className="absolute -translate-x-1/2 -translate-y-1/2 focus-visible:outline-none"
                  style={{ top: zone.top, left: zone.left }}
                  onClick={() => setSelectedZone(zone.id)}
                  aria-label={`${zone.name}: ${routes.length} hojas de ruta`}
                >
                  <span
                    className="animate-marker flex size-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow-lg"
                    style={{ backgroundColor: color }}
                  >
                    {routes.length}
                  </span>
                  <span className="mt-1 block whitespace-nowrap rounded bg-black/85 px-1.5 py-0.5 text-[9px] font-medium text-white ring-1" style={{ borderColor: color }}>
                    {zone.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={selectedZoneInfo ? selectedZoneInfo.name : 'Equipos en planta'}
        description={
          selectedZoneInfo
            ? `${selectedRoutes.length} hoja(s) de ruta en esta área.`
            : 'Selecciona un punto del plano para filtrar los equipos.'
        }
      >
        {selectedZone ? (
          selectedRoutes.length === 0 ? (
            <EmptyState icon={MapPin} title="Sin equipos en esta área" description="No hay hojas activas ubicadas aquí." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {selectedRoutes.map((route) => {
                const currentPhase =
                  route.phases.find((phase) => phase.status === 'IN_PROGRESS') ??
                  route.phases.find((phase) => phase.status === 'PENDING');
                const color = alertColor(route);
                return (
                  <Link
                    key={route.id}
                    to={`/hojas-de-ruta/${route.id}`}
                    className="rounded-xl border border-border/70 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{route.code}</p>
                        <p className="truncate text-xs text-muted-foreground">{route.component.name}</p>
                      </div>
                      <RouteStatusBadge status={route.status} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Fase: {currentPhase?.name ?? 'Sin fase activa'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Área: {currentPhase ? AREA_BY_ID[currentPhase.areaId].shortName : '—'}
                    </p>
                    {color === '#ff4d5e' && (
                      <Badge variant="destructive" className="mt-2 gap-1 text-[10px]">
                        <TriangleAlert className="size-3" /> Atención crítica
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          )
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {ZONES.map((zone) => (
              <button
                key={zone.id}
                type="button"
                onClick={() => setSelectedZone(zone.id)}
                className="flex items-center justify-between gap-2 rounded-xl border border-border/70 p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <span className="size-2 rounded-full" style={{ backgroundColor: zone.color }} />
                  {zone.name}
                </span>
                <Badge variant="outline">{byZone.get(zone.id)?.length ?? 0}</Badge>
              </button>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
