import type { CreateTaskInput, RouteSheetRecord, TaskRecord } from '@turbopre/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Bot, ClipboardCheck, FileText, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/empty-state';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/common/page-header';
import { ProgressBar } from '@/components/common/progress-bar';
import { SectionCard } from '@/components/common/section-card';
import {
  ApiTaskBuilder,
  createEmptyApiTask,
} from '@/components/tasks/api-task-builder';
import { ApiTaskList } from '@/components/tasks/api-task-list';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { useInspection, useInspections } from '@/hooks/use-inspections';
import { useRouteSheet, useRouteSheets } from '@/hooks/use-route-sheets';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/formatters';
import { canManageRoutes } from '@/lib/permissions';
import { catalogsService } from '@/services/catalogs/catalogs.service';
import { routeSheetsService } from '@/services/route-sheets/route-sheets.service';

interface AiSuggestion {
  positionCode: string;
  description: string;
  criteria: string;
  formRef: string;
}

function buildAiSuggestions(
  description: string,
  scope: string,
  findings: string,
): AiSuggestion[] {
  const text = `${description} ${scope} ${findings}`.toLowerCase();

  if (text.includes('cojinete') || text.includes('babbitt') || text.includes('babbit')) {
    return [
      { positionCode: 'DEBURRER', description: 'Verificar remoción total del Babbitt y preparar la superficie.', criteria: 'PR-TUR-100', formRef: 'N/A' },
      { positionCode: 'MACHINE_OPERATOR_I', description: 'Mecanizar y ajustar la geometría del cojinete según plano.', criteria: 'PR-TUR-100', formRef: 'N/A' },
      { positionCode: 'QUALITY_INSPECTOR', description: 'Ejecutar END con tintes penetrantes y verificar dimensiones finales.', criteria: 'IN-CAL-102', formRef: 'FO-ING-110' },
      { positionCode: 'DRAWING_ENGINEER', description: 'Revisar y firmar el plano final de reparación.', criteria: 'PR-ING-101', formRef: 'FO-ING-121' },
    ];
  }

  if (text.includes('generador') || text.includes('estator') || text.includes('bobina')) {
    return [
      { positionCode: 'ABRASIVE_CLEANER', description: 'Limpieza abrasiva y secado del estator.', criteria: 'PR-GEN-100', formRef: 'N/A' },
      { positionCode: 'WINDER_I', description: 'Revisar bobinas, cuñas y conexiones del estator.', criteria: 'PR-GEN-110', formRef: 'FO-ING-170' },
      { positionCode: 'QUALITY_INSPECTOR', description: 'Prueba de resistencia de aislamiento y registro de resultados.', criteria: 'IN-CAL-115', formRef: 'FO-ING-111' },
      { positionCode: 'PMI_INSPECTOR', description: 'Validar materiales y emitir informe técnico.', criteria: 'PR-ING-120', formRef: 'FO-ING-140' },
    ];
  }

  if (text.includes('soldadura') || text.includes('fisura') || text.includes('grieta')) {
    return [
      { positionCode: 'WELDER_I', description: 'Preparar la zona y ejecutar la soldadura según procedimiento.', criteria: 'PR-SOL-100', formRef: 'N/A' },
      { positionCode: 'QUALITY_INSPECTOR', description: 'Ejecutar END a la soldadura y liberar el componente.', criteria: 'IN-CAL-102', formRef: 'FO-ING-110' },
      { positionCode: 'MACHINE_OPERATOR_I', description: 'Mecanizar el acabado final de la zona reparada.', criteria: 'PR-TUR-100', formRef: 'N/A' },
    ];
  }

  return [
    { positionCode: 'ROTATING_SPECIALIST', description: 'Revisar el estado general del componente y registrar hallazgos.', criteria: 'PR-TUR-100', formRef: 'FO-ING-110' },
    { positionCode: 'MACHINE_OPERATOR_I', description: 'Ejecutar el mecanizado de recuperación según plano.', criteria: 'PR-TUR-100', formRef: 'N/A' },
    { positionCode: 'QUALITY_INSPECTOR', description: 'Verificar dimensiones, acabado y evidencias del trabajo.', criteria: 'IN-CAL-132', formRef: 'FO-ING-157' },
  ];
}

function taskToInput(task: TaskRecord): CreateTaskInput {
  return {
    stage: task.stage,
    jobPositionId: task.jobPositionId,
    assignedToId: task.assignedToId,
    description: task.description,
    criteria: task.criteria,
    formRef: task.formRef,
    requiresEvidence: task.requiresEvidence,
    estimatedMinutes: task.estimatedMinutes,
  };
}

export function RouteSheetEditorPage() {
  const user = useCurrentUser();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const editingRouteId = params.get('id');
  const queryInspectionId = params.get('inspeccion');
  const routeQuery = useRouteSheet(editingRouteId ?? undefined);
  const routesQuery = useRouteSheets();
  const inspectionsQuery = useInspections();
  const catalogsQuery = useQuery({
    queryKey: ['catalogs', 'organization'],
    queryFn: () => catalogsService.getOrganization(),
    staleTime: 5 * 60_000,
  });

  const editingRoute = routeQuery.data;
  const [selectedInspectionId, setSelectedInspectionId] = useState('');
  const inspectionQuery = useInspection(selectedInspectionId || undefined);
  const inspection = inspectionQuery.data;

  const approvedInspections = useMemo(() => {
    const usedInspectionIds = new Set(
      (routesQuery.data ?? [])
        .map((route) => route.inspection?.id)
        .filter((id): id is string => Boolean(id)),
    );

    return (inspectionsQuery.data ?? []).filter(
      (candidate) =>
        candidate.status === 'APPROVED' && !usedInspectionIds.has(candidate.id),
    );
  }, [inspectionsQuery.data, routesQuery.data]);

  useEffect(() => {
    if (selectedInspectionId) return;

    const preferred =
      editingRoute?.inspection?.id ??
      queryInspectionId ??
      approvedInspections[0]?.id;

    if (preferred) {
      setSelectedInspectionId(preferred);
    }
  }, [
    approvedInspections,
    editingRoute?.inspection?.id,
    queryInspectionId,
    selectedInspectionId,
  ]);

  const [notes, setNotes] = useState('');
  const [routeTasks, setRouteTasks] = useState<CreateTaskInput[]>([]);
  const [aiDraftUsed, setAiDraftUsed] = useState(false);
  const initializedFor = useRef<string | null>(null);

  const inspectionStage = inspection
    ? inspection.tasks.reduce((max, task) => Math.max(max, task.stage), 0)
    : 0;
  const nextStage = inspectionStage + 1;

  useEffect(() => {
    if (!editingRoute) return;

    const key = `route:${editingRoute.id}`;
    if (initializedFor.current === key) return;
    initializedFor.current = key;

    setNotes(editingRoute.notes ?? '');
    setRouteTasks(
      editingRoute.tasks
        .filter((task) => task.source === 'ROUTE_SHEET')
        .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
        .map(taskToInput),
    );
    setAiDraftUsed(false);
  }, [editingRoute]);

  useEffect(() => {
    if (editingRoute || !inspection || !catalogsQuery.data) return;

    const key = `inspection:${inspection.id}`;
    if (initializedFor.current === key) return;
    initializedFor.current = key;

    setRouteTasks([createEmptyApiTask(catalogsQuery.data, nextStage)]);
    setNotes('');
    setAiDraftUsed(false);
  }, [catalogsQuery.data, editingRoute, inspection, nextStage]);

  const saveMutation = useMutation({
    mutationFn: async (sendToApproval: boolean) => {
      const tasks = routeTasks
        .filter((task) => task.description.trim() && task.jobPositionId)
        .map((task) => ({
          ...task,
          description: task.description.trim(),
        }));

      if (tasks.length === 0) {
        throw new Error('Agrega al menos una tarea a la hoja de ruta');
      }

      let saved: RouteSheetRecord;

      if (editingRoute) {
        saved = await routeSheetsService.update(editingRoute.id, {
          notes: notes.trim() || null,
        });

        if (editingRoute.status === 'DRAFT') {
          saved = await routeSheetsService.replaceTasks(editingRoute.id, { tasks });
        }
      } else {
        if (!inspection) {
          throw new Error('Selecciona la inspección de origen');
        }

        saved = await routeSheetsService.create({
          inspectionId: inspection.id,
          notes: notes.trim() || null,
          tasks,
        });
      }

      if (sendToApproval) {
        saved = await routeSheetsService.submit(saved.id);
      }

      return saved;
    },
    onSuccess: (saved, sendToApproval) => {
      void queryClient.invalidateQueries({ queryKey: ['route-sheets'] });
      void queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      toast.success(
        sendToApproval
          ? 'Hoja enviada al Gerente para aprobación'
          : 'Hoja de ruta guardada',
        { description: saved.code },
      );
      navigate(`/hojas-de-ruta/${saved.id}`);
    },
    onError: (error) =>
      toast.error('No se pudo guardar la hoja de ruta', {
        description: getApiErrorMessage(error),
      }),
  });

  const handleAi = () => {
    if (!inspection || !catalogsQuery.data) return;

    const suggestions = buildAiSuggestions(
      inspection.serviceOrder.description,
      inspection.serviceOrder.scope,
      inspection.technicalDetails ?? '',
    );

    const mapped = suggestions
      .map((suggestion): CreateTaskInput | null => {
        const position = catalogsQuery.data.jobPositions.find(
          (candidate) => candidate.code === suggestion.positionCode && candidate.isActive,
        );

        if (!position) return null;

        return {
          stage: nextStage,
          jobPositionId: position.id,
          assignedToId: null,
          description: suggestion.description,
          criteria: suggestion.criteria,
          formRef: suggestion.formRef,
          requiresEvidence: true,
        };
      })
      .filter((task): task is CreateTaskInput => task !== null);

    setRouteTasks((current) => [
      ...current.filter((task) => task.description.trim()),
      ...mapped,
    ]);
    setAiDraftUsed(true);
    toast.success('Borrador de IA generado', {
      description: 'Revisa y ajusta cada tarea antes de enviarla a aprobación.',
    });
  };

  if (!user) return null;

  if (!canManageRoutes(user)) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Solo Ingeniería y Administración pueden crear hojas de ruta.
        </p>
      </div>
    );
  }

  if (editingRouteId && routeQuery.isLoading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Cargando hoja de ruta…
      </div>
    );
  }

  if (editingRouteId && !editingRoute) {
    return (
      <div className="mx-auto max-w-xl py-16">
        <EmptyState
          icon={FileText}
          title="Hoja de ruta no encontrada"
          description="La hoja solicitada no existe o fue eliminada."
          action={
            <Button asChild variant="outline">
              <Link to="/hojas-de-ruta">
                <ArrowLeft /> Volver al listado
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (!editingRoute && inspectionsQuery.isLoading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Cargando inspecciones aprobadas…
      </div>
    );
  }

  if (!editingRoute && approvedInspections.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-16 text-center">
        <FileText className="mx-auto size-10 text-muted-foreground" />
        <p className="font-heading text-lg font-semibold">
          No hay una inspección aprobada disponible
        </p>
        <p className="text-sm text-muted-foreground">
          La hoja de ruta se crea desde una inspección aprobada por Taller. Revisa
          la bandeja de inspecciones.
        </p>
        <Button asChild>
          <Link to="/taller/inspecciones">
            <ClipboardCheck /> Ver inspecciones
          </Link>
        </Button>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Cargando inspección de origen…
      </div>
    );
  }

  const isDraft = !editingRoute || editingRoute.status === 'DRAFT';
  const readOnly = editingRoute && editingRoute.status !== 'DRAFT';
  const order = inspection.serviceOrder;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3 text-muted-foreground">
          <Link to="/hojas-de-ruta">
            <ArrowLeft /> Volver a hojas de ruta
          </Link>
        </Button>
        <PageHeader
          eyebrow={`${inspection.code} · ODS ${order.orderNumber} · ${order.clientName}`}
          title={editingRoute ? `Editar ${editingRoute.code}` : 'Nueva hoja de ruta'}
          description="La inspección aprobada se conserva como primeros pasos ya realizados. Agrega las tareas de taller, calidad e ingeniería."
          actions={
            isDraft ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={saveMutation.isPending}
                  onClick={() => saveMutation.mutate(false)}
                >
                  {saveMutation.isPending ? 'Guardando…' : 'Guardar borrador'}
                </Button>
                <Button
                  size="sm"
                  disabled={saveMutation.isPending}
                  onClick={() => saveMutation.mutate(true)}
                >
                  Enviar a aprobación <ArrowRight />
                </Button>
              </div>
            ) : undefined
          }
        />
      </div>

      {!editingRoute && approvedInspections.length > 1 && (
        <SectionCard
          title="Inspección de origen"
          description="Selecciona la inspección aprobada que dará origen a la hoja."
        >
          <Select
            value={selectedInspectionId}
            onValueChange={setSelectedInspectionId}
          >
            <SelectTrigger className="w-full max-w-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {approvedInspections.map((candidate) => (
                <SelectItem key={candidate.id} value={candidate.id}>
                  {candidate.code} · {candidate.serviceOrder.orderNumber} ·{' '}
                  {candidate.serviceOrder.clientName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SectionCard>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          title="Cabezal de la hoja de ruta"
          description="Los datos del servicio vienen de la ODS y su inspección aprobada."
        >
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Descripción del servicio</dt>
              <dd className="font-medium text-foreground">{order.description}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Cliente</dt>
              <dd className="font-medium">{order.clientName}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Sitio / planta</dt>
              <dd className="font-medium">{order.siteName}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Equipo</dt>
              <dd className="font-medium">
                {order.equipmentName} · {order.equipmentCode}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Serial</dt>
              <dd className="font-mono text-xs">{order.equipmentSerial ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Fecha compromiso</dt>
              <dd className="font-medium">
                {order.dueAt ? formatDate(order.dueAt) : 'Sin fecha'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Alcance</dt>
              <dd className="font-medium">{order.scope}</dd>
            </div>
            <div className="sm:col-span-2">
              <Field>
                <FieldLabel htmlFor="route-observations">Observaciones</FieldLabel>
                <Textarea
                  id="route-observations"
                  rows={3}
                  value={notes}
                  disabled={!isDraft}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Ej: Se debe registrar evidencia fotográfica de cada paso."
                />
              </Field>
            </div>
          </dl>
          {readOnly && (
            <p className="mt-3 rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-muted-foreground">
              Esta hoja ya fue enviada a aprobación. Las tareas y observaciones solo
              se modifican desde el detalle de la hoja mediante tareas de corrección.
            </p>
          )}
        </SectionCard>

        <SectionCard
          title="Inspección de origen"
          description="Estos pasos ya están realizados y forman parte de la hoja."
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground">{inspection.code}</p>
                <p className="text-xs text-muted-foreground">
                  Aprobada por {inspection.approvedBy?.name ?? 'Taller'} ·{' '}
                  {inspection.approvedAt
                    ? new Date(inspection.approvedAt).toLocaleDateString('es-VE')
                    : '—'}
                </p>
              </div>
              <Badge variant="outline">Aprobada</Badge>
            </div>
            <ProgressBar
              value={inspection.progress}
              label={`${inspection.completedTasks} de ${inspection.totalTasks} tareas`}
            />
            <div className="max-h-80 overflow-y-auto pr-1">
              <ApiTaskList tasks={inspection.tasks} />
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Tareas de la hoja de ruta"
        description="Las tareas se ejecutan por etapa. Ajusta el puesto, el responsable y la descripción."
        actions={
          isDraft ? (
            <Button type="button" variant="outline" size="sm" onClick={handleAi}>
              <Sparkles /> Generar borrador con IA
            </Button>
          ) : undefined
        }
      >
        {isDraft ? (
          <ApiTaskBuilder
            tasks={routeTasks}
            onChange={setRouteTasks}
            defaultStage={nextStage}
          />
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-muted-foreground">
              Esta hoja ya fue enviada a aprobación. Para corregir tareas después de
              la ejecución, usa el detalle de la hoja y agrega una tarea de corrección.
            </div>
            <ApiTaskList tasks={editingRoute.tasks} />
          </div>
        )}
      </SectionCard>

      <div className="rounded-xl border border-info/30 bg-info/5 p-4">
        <div className="flex items-start gap-3">
          <Bot className="mt-0.5 size-5 shrink-0 text-info" />
          <div className="space-y-1 text-xs leading-relaxed text-muted-foreground">
            <p className="font-semibold text-foreground">Asistente CAMI (IA)</p>
            <p>
              La IA es opcional. Genera un borrador de tareas a partir de la
              descripción de la ODS y los hallazgos de la inspección. El ingeniero debe
              revisar, ajustar y enviar la hoja a aprobación de Gerencia antes de
              liberar tareas a los operadores.
            </p>
            {aiDraftUsed && (
              <p className="font-medium text-foreground">
                Se agregó un borrador. Revisa cada tarea antes de guardar.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
