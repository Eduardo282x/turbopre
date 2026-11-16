import { Plus, Trash2, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { RoleBadge } from '@/components/common/role-badge';
import { StatusBadge } from '@/components/common/status-badge';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { FormDialog } from '@/components/common/form-dialog';
import { KpiCard } from '@/components/common/kpi-card';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/table-kit/table';
import type { DataTableColumn } from '@/components/table-kit/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { AREAS, ROLE_OPTIONS, getAreaName, getRoleLabel } from '@/features/preview/config';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { AreaId, RoleId, User } from '@/features/preview/types';
import { formatDate, getInitials } from '@/lib/formatters';
import { canManageUsers } from '@/lib/permissions';

export function UsersPage() {
  const currentUser = useCurrentUser();
  const db = usePreviewStore((state) => state.db);
  const createUser = usePreviewStore((state) => state.createUser);
  const deleteUser = usePreviewStore((state) => state.deleteUser);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<RoleId>('OPERATOR');
  const [areaId, setAreaId] = useState<AreaId>('turbines');

  if (!currentUser) return null;

  const operators = db.users.filter((user) => user.role === 'OPERATOR').length;
  const active = db.users.filter((user) => user.active).length;

  const columns: DataTableColumn<User>[] = [
    {
      id: 'user',
      header: 'Usuario',
      cell: (user) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
          </div>
        </div>
      ),
      sortable: true,
      sortValue: (user) => user.name,
    },
    {
      id: 'role',
      header: 'Rol',
      cell: (user) => <RoleBadge role={user.role} areaId={user.areaId} />,
      sortable: true,
      sortValue: (user) => getRoleLabel(user.role),
    },
    {
      id: 'area',
      header: 'Área',
      cell: (user) => <span className="text-xs">{user.areaId ? getAreaName(user.areaId) : 'Global'}</span>,
      hideOnMobile: true,
    },
    {
      id: 'email',
      header: 'Correo',
      cell: (user) => <span className="text-xs text-muted-foreground">{user.email}</span>,
      hideOnMobile: true,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (user) => (
        <StatusBadge tone={user.active ? 'success' : 'danger'} dot>
          {user.active ? 'Activo' : 'Inactivo'}
        </StatusBadge>
      ),
    },
    {
      id: 'created',
      header: 'Ingreso',
      cell: (user) => <span className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</span>,
      hideOnMobile: true,
      sortable: true,
      sortValue: (user) => new Date(user.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administración"
        title="Usuarios"
        description="Usuarios, roles y áreas operativas del sistema."
        actions={
          canManageUsers(currentUser) ? (
            <Button onClick={() => setCreateOpen(true)}>
              <UserPlus /> Crear usuario
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Usuarios" value={db.users.length} hint="Cuentas registradas" icon={Users} tone="accent" />
        <KpiCard label="Activos" value={active} hint="Con acceso al sistema" icon={UserPlus} tone="success" />
        <KpiCard label="Operadores" value={operators} hint="Con área operativa" icon={Users} tone="info" />
      </div>

      <DataTable
        data={db.users}
        columns={columns}
        getRowId={(user) => user.id}
        search={{
          placeholder: 'Buscar por nombre, usuario, correo o rol…',
          getText: (user) => `${user.name} ${user.username} ${user.email} ${getRoleLabel(user.role)}`,
        }}
        actions={[
          {
            label: 'Eliminar',
            icon: Trash2,
            variant: 'destructive',
            hidden: (user) => !canManageUsers(currentUser) || user.id === currentUser.id,
            onSelect: (user) => setDeleting(user),
          },
        ]}
        pageSize={10}
        emptyTitle="Sin usuarios"
        emptyDescription="Crea el primer usuario del sistema."
        caption="Usuarios del sistema"
      />

      <FormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Crear usuario"
        description="Asigna un rol y, si aplica, un área operativa."
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!name.trim() || !username.trim()) {
                  toast.error('El nombre y el usuario son obligatorios');
                  return;
                }
                createUser(
                  {
                    name: name.trim(),
                    username: username.trim(),
                    email: email.trim() || `${username.trim()}@turbopre.com`,
                    role,
                    areaId: role === 'GLOBAL' ? undefined : areaId,
                  },
                  currentUser.id,
                );
                toast.success('Usuario creado');
                setCreateOpen(false);
                setName('');
                setUsername('');
                setEmail('');
              }}
            >
              <Plus /> Guardar usuario
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="user-name">Nombre completo</FieldLabel>
            <Input id="user-name" value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="user-username">Nombre de usuario</FieldLabel>
            <Input id="user-username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="juan.perez" />
          </Field>
          <Field>
            <FieldLabel htmlFor="user-email">Correo</FieldLabel>
            <Input id="user-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Rol</FieldLabel>
            <Select value={role} onValueChange={(value) => setRole(value as RoleId)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel>Área operativa</FieldLabel>
            <Select value={areaId} onValueChange={(value) => setAreaId(value as AreaId)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AREAS.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Eliminar usuario"
        description={`¿Seguro que deseas eliminar a ${deleting?.name ?? 'este usuario'}? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        destructive
        onConfirm={() => {
          if (!deleting) return;
          deleteUser(deleting.id, currentUser.id);
          toast.info('Usuario eliminado');
          setDeleting(null);
        }}
      />
    </div>
  );
}
