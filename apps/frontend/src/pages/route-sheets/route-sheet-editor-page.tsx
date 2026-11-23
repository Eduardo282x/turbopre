import { ArrowLeft, ArrowRight, Bot, ClipboardCheck, FileText, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/page-header';
import { ProgressBar } from '@/components/common/progress-bar';
import { SectionCard } from '@/components/common/section-card';
import { TaskBuilder, createEmptyTask } from '@/components/tasks/task-builder';
import { TaskList } from '@/components/tasks/task-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  getApprovedInspectionsWithoutRoute,
  getInspectionWithRelations,
  getRouteSheetWithRelations,
} from '@/features/preview/store/selectors';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { NewRouteSheetInput, NewTaskInput } from '@/features/preview/types';
import { toDateInputValue } from '@/lib/formatters';
import { canManageRoutes } from '@/lib/permissions';

interface AiSuggestion extends NewTaskInput {
  key: string;
}

function buildAiSuggestions(
  description: string,
  scope: string,
  findings: string,
  stage: number,
): AiSuggestion[] {
  const text = `${description} ${scope} ${findings}`.toLowerCase();
  const suggestions: Array<Omit<AiSuggestion, 'key' | 'stage'>> = [];

  if (text.includes('cojinete') || text.includes('babbitt') || text.includes('babbit')) {
    suggestions.push(
      { processId: 'machining', positionId: 'deburrer', description: 'Verificar remoción total del Babbitt y preparar la superficie.', criteria: 'PR-TUR-100', forms: 'N/A' },
      { processId: 'machining', positionId: 'machine_operator_1', description: 'Mecanizar y ajustar la geometría del cojinete según plano.', criteria: 'PR-TUR-100', forms: 'N/A' },
      { processId: 'quality', positionId: 'quality_inspector', description: 'Ejecutar END con tintes penetrantes y verificar dimensiones finales.', criteria: 'IN-CAL-102', forms: 'FO-ING-110' },
      { processId: 'engineering', positionId: 'eng_plans', description: 'Revisar y firmar el plano final de reparación.', criteria: 'PR-ING-101', forms: 'FO-ING-121' },
    );
  } else if (text.includes('generador') || text.includes('estator') || text.includes('bobina')) {
    suggestions.push(
      { processId: 'generators', positionId: 'abrasive_operator', description: 'Limpieza abrasiva y secado del estator.', criteria: 'PR-GEN-100', forms: 'N/A' },
      { processId: 'generators', positionId: 'winder_1', description: 'Revisar bobinas, cuñas y conexiones del estator.', criteria: 'PR-GEN-110', forms: 'FO-ING-170' },
      { processId: 'quality', positionId: 'quality_inspector', description: 'Prueba de resistencia de aislamiento y registro de resultados.', criteria: 'IN-CAL-115', forms: 'FO-ING-111' },
      { processId: 'engineering', positionId: 'eng_pmi', description: 'Validar materiales y emitir informe técnico.', criteria: 'PR-ING-120', forms: 'FO-ING-140' },
    );
  } else if (text.includes('soldadura') || text.includes('fisura') || text.includes('grieta')) {
    suggestions.push(
      { processId: 'welding', positionId: 'welder_1', description: 'Preparar la zona y ejecutar la soldadura según procedimiento.', criteria: 'PR-SOL-100', forms: 'N/A' },
      { processId: 'quality', positionId: 'quality_inspector', description: 'Ejecutar END a la soldadura y liberar el componente.', criteria: 'IN-CAL-102', forms: 'FO-ING-110' },
      { processId: 'machining', positionId: 'machine_operator_1', description: 'Mecanizar el acabado final de la zona reparada.', criteria: 'PR-TUR-100', forms: 'N/A' },
    );
  } else {
    suggestions.push(
      { processId: 'rotating', positionId: 'rotating_specialist', description: 'Revisar el estado general del componente y registrar hallazgos.', criteria: 'PR-TUR-100', forms: 'FO-ING-110' },
      { processId: 'machining', positionId: 'machine_operator_1', description: 'Ejecutar el mecanizado de recuperación según plano.', criteria: 'PR-TUR-100', forms: 'N/A' },
      { processId: 'quality', positionId: 'quality_inspector', description: 'Verificar dimensiones, acabado y evidencias del trabajo.', criteria: 'IN-CAL-132', forms: 'FO-ING-157' },
    );
  }

  return suggestions.map((suggestion, index) => ({
    ...suggestion,
    key: `ai-${Date.now()}-${index}`,
    stage,
  }));
}

export function RouteSheetEditorPage() {
  const user = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const createRouteSheet = usePreviewStore((state) => state.createRouteSheet);
  const updateRouteSheet = usePreviewStore((state) => state.updateRouteSheet);
  const replaceRouteTasks = usePreviewStore((state) => state.replaceRouteTasks);
  const sendRouteToApproval = usePreviewStore((state) => state.sendRouteToApproval);
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const editingRouteId = params.get('id');
  const queryInspectionId = params.get('inspeccion');
  const editingRoute = editingRouteId ? getRouteSheetWithRelations(db, editingRouteId) : undefined;
  const approvedInspections = useMemo(() => getApprovedInspectionsWithoutRoute(db), [db]);

  const [selectedInspectionId, setSelectedInspectionId] = useState(
    editingRoute?.inspectionId ?? queryInspectionId ?? approvedInspections[0]?.id ?? '',
  );
  const inspection = selectedInspectionId ? getInspectionWithRelations(db, selectedInspectionId) : undefined;
  const order = inspection?.serviceOrder;

  const [description, setDescription] = useState('');
  const [serial, setSerial] = useState('');
  const [equipmentCode, setEquipmentCode] = useState('');
  const [site, setSite] = useState('');
  const [scope, setScope] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [dueDate, setDueDate] = useState(toDateInputValue(new Date()));
  const [observations, setObservations] = useState('');
  const [routeTasks, setRouteTasks] = useState<NewTaskInput[]>([]);
  const [aiDraftUsed, setAiDraftUsed] = useState(false);

  useEffect(() => {
    if (editingRoute) {
      setSelectedInspectionId(editingRoute.inspectionId);
      setDescription(editingRoute.description);
      setSerial(editingRoute.serial);
      setEquipmentCode(editingRoute.equipmentCode);
      setSite(editingRoute.site);
      setScope(editingRoute.scope);
      setPriority(editingRoute.priority);
      setDueDate(toDateInputValue(editingRoute.dueDate));
      setObservations(editingRoute.observations ?? '');
      setRouteTasks(
        editingRoute.tasks
          .filter((task) => task.source === 'ROUTE')
          .sort((a, b) => a.step - b.step)
          .map((task) => ({
            stage: task.stage,
            processId: task.processId,
            positionId: task.positionId,
            assignedUserId: task.assignedUserId,
            description: task.description,
            criteria: task.criteria,
            forms: task.forms,
          })),
      );
      setAiDraftUsed(Boolean(editingRoute.aiDraftUsed));
      return;
    }

    if (!inspection) return;
    const asset = inspection.asset;
    setDescription(order?.description ?? '');
    setSerial(asset?.serial ?? '');
    setEquipmentCode(order?.equipmentCode ?? asset?.tag ?? '');
    setSite(order?.site ?? '');
    setScope(order?.scope ?? '');
    setPriority(order?.priority ?? 'MEDIUM');
    setDueDate(toDateInputValue(order?.dueDate ?? new Date()));
    setObservations('');
    const inspectionStage = inspection.tasks.reduce((max, task) => Math.max(max, task.stage), 0);
    setRouteTasks([createEmptyTask('rotating', inspectionStage + 1)]);
    setAiDraftUsed(false);
  }, [inspection?.id, editingRoute?.id]);

  if (!user) return null;

  if (!canManageRoutes(user)) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="text-sm text-muted-foreground">Solo Ingeniería y Administración pueden crear hojas de ruta.</p>
      </div>
    );
  }

  if (!inspection || !order || inspection.status !== 'APPROVED') {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-16 text-center">
        <FileText className="mx-auto size-10 text-muted-foreground" />
        <p className="font-heading text-lg font-semibold">No hay una inspección aprobada disponible</p>
        <p className="text-sm text-muted-foreground">
          La hoja de ruta se crea desde una inspección aprobada por Taller. Revisa la bandeja de inspecciones.
        </p>
        <Button asChild>
          <Link to="/taller/inspecciones">
            <ClipboardCheck /> Ver inspecciones
          </Link>
        </Button>
      </div>
    );
  }

  const selectedInspection = inspection;
  const inspectionStage = selectedInspection.tasks.reduce((max, task) => Math.max(max, task.stage), 0);
  const nextStage = inspectionStage + 1;
  const isDraft = !editingRoute || editingRoute.status === 'DRAFT';
  const inspectionProgress = selectedInspection.progress;

  const handleAi = () => {
    const suggestions = buildAiSuggestions(
      order.description,
      order.scope,
      selectedInspection.findings ?? '',
      nextStage,
    );
    setRouteTasks((current) => [...current.filter((task) => task.description.trim()), ...suggestions]);
    setAiDraftUsed(true);
    toast.success('Borrador de IA generado', {
      description: 'Revisa y ajusta cada tarea antes de enviarla a aprobación.',
    });
  };

  const save = (sendToApproval: boolean) => {
    if (!description.trim() || !serial.trim() || !site.trim()) {
      toast.error('Completa la descripción, el serial y el sitio');
      return;
    }
    if (routeTasks.filter((task) => task.description.trim()).length === 0) {
      toast.error('Agrega al menos una tarea a la hoja de ruta');
      return;
    }
    const input: NewRouteSheetInput = {
      inspectionId: selectedInspection.id,
      description: description.trim(),
      serial: serial.trim(),
      equipmentCode: equipmentCode.trim(),
      site: site.trim(),
      scope: scope.trim(),
      priority,
      dueDate: new Date(`${dueDate}T12:00:00`).toISOString(),
      observations: observations.trim() || undefined,
      tasks: routeTasks
        .filter((task) => task.description.trim())
        .map((task) => ({ ...task, description: task.description.trim() })),
      aiDraftUsed,
    };

    if (editingRoute) {
      updateRouteSheet(editingRoute.id, input, user.id);
      if (editingRoute.status === 'DRAFT') {
        replaceRouteTasks(editingRoute.id, input.tasks, user.id);
      }
      if (sendToApproval && editingRoute.status === 'DRAFT') {
        sendRouteToApproval(editingRoute.id, user.id);
      }
      toast.success(sendToApproval ? 'Hoja actualizada y enviada a aprobación' : 'Hoja de ruta actualizada');
      navigate(`/hojas-de-ruta/${editingRoute.id}`);
      return;
    }

    const routeId = createRouteSheet(input, user.id);
    if (sendToApproval) sendRouteToApproval(routeId, user.id);
    toast.success(sendToApproval ? 'Hoja enviada al Gerente para aprobación' : 'Borrador de hoja de ruta guardado');
    navigate(`/hojas-de-ruta/${routeId}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3 text-muted-foreground">
          <Link to="/hojas-de-ruta">
            <ArrowLeft /> Volver a hojas de ruta
          </Link>
        </Button>
        <PageHeader
          eyebrow={`${order.code} · ${order.subCode} · ${selectedInspection.client?.name ?? 'Sin cliente'}`}
          title={editingRoute ? `Editar ${editingRoute.code}` : 'Nueva hoja de ruta'}
          description="La inspección aprobada se copia como primeros pasos ya realizados. Agrega las tareas de taller, calidad e ingeniería."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => save(false)}>
                {editingRoute ? 'Guardar cambios' : 'Guardar borrador'}
              </Button>
              {isDraft && (
                <Button size="sm" onClick={() => save(true)}>
                  Enviar a aprobación <ArrowRight />
                </Button>
              )}
            </div>
          }
        />
      </div>

      {!editingRoute && approvedInspections.length > 1 && (
        <SectionCard title="Inspección de origen" description="Selecciona la inspección aprobada que dará origen a la hoja.">
          <Select value={selectedInspectionId} onValueChange={setSelectedInspectionId}>
            <SelectTrigger className="w-full max-w-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {approvedInspections.map((candidate) => (
                <SelectItem key={candidate.id} value={candidate.id}>
                  {candidate.code} · {candidate.serviceOrder.code} · {candidate.client?.name ?? 'Sin cliente'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SectionCard>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title="Cabezal de la hoja de ruta" description="Datos que taller necesita para ejecutar el trabajo.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="route-description">Descripción del servicio</FieldLabel>
              <Textarea
                id="route-description"
                rows={2}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="route-serial">Serial del equipo</FieldLabel>
              <Input id="route-serial" value={serial} onChange={(event) => setSerial(event.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="route-equipment">Código del equipo</FieldLabel>
              <Input id="route-equipment" value={equipmentCode} onChange={(event) => setEquipmentCode(event.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="route-site">Sitio / planta</FieldLabel>
              <Input id="route-site" value={site} onChange={(event) => setSite(event.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="route-due">Fecha compromiso</FieldLabel>
              <Input id="route-due" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Prioridad</FieldLabel>
              <Select value={priority} onValueChange={(value) => setPriority(value as typeof priority)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Baja</SelectItem>
                  <SelectItem value="MEDIUM">Media</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="CRITICAL">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="route-scope">Alcance</FieldLabel>
              <Input id="route-scope" value={scope} onChange={(event) => setScope(event.target.value)} />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="route-observations">Observaciones</FieldLabel>
              <Textarea
                id="route-observations"
                rows={2}
                value={observations}
                onChange={(event) => setObservations(event.target.value)}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Inspección de origen" description="Estos pasos ya están realizados y se copiarán a la hoja.">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground">{selectedInspection.code}</p>
                <p className="text-xs text-muted-foreground">
                  Aprobada por {selectedInspection.approver?.name ?? 'Taller'} ·{' '}
                  {selectedInspection.approvedAt ? new Date(selectedInspection.approvedAt).toLocaleDateString('es-VE') : '—'}
                </p>
              </div>
              <Badge variant="outline">Aprobada</Badge>
            </div>
            <ProgressBar
              value={inspectionProgress}
              label={`${selectedInspection.completedTasks} de ${selectedInspection.totalTasks} tareas`}
            />
            <div className="max-h-80 overflow-y-auto pr-1">
              <TaskList tasks={selectedInspection.tasks} />
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
          <TaskBuilder
            tasks={routeTasks}
            onChange={setRouteTasks}
            defaultStage={nextStage}
            defaultProcessId="rotating"
          />
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-muted-foreground">
              Esta hoja ya fue enviada a aprobación. Para corregir tareas después de la ejecución,
              usa el detalle de la hoja y agrega una tarea de corrección.
            </div>
            <TaskList tasks={editingRoute.tasks} />
          </div>
        )}
      </SectionCard>

      <div className="rounded-xl border border-info/30 bg-info/5 p-4">
        <div className="flex items-start gap-3">
          <Bot className="mt-0.5 size-5 shrink-0 text-info" />
          <div className="space-y-1 text-xs leading-relaxed text-muted-foreground">
            <p className="font-semibold text-foreground">Asistente CAMI (IA)</p>
            <p>
              La IA es opcional. Genera un borrador de tareas a partir de la descripción de la ODS y los
              hallazgos de la inspección. El ingeniero debe revisar, ajustar y enviar la hoja a aprobación
              de Gerencia antes de liberar tareas a los operadores.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
