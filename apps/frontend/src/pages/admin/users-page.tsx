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
import {
  POSITION_BY_ID,
  ROLE_OPTIONS,
  getPositionName,
  getPositionsForRole,
  getRoleLabel,
} from '@/features/preview/config';
import { useCurrentUser } from '@/features/preview/store/preview-session';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import type { NewUserInput, PositionId, RoleId, User } from '@/features/preview/types';
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
  const [password, setPassword] = useState('demo1234');
  const [role, setRole] = useState<RoleId>('OPERATOR');
  const [positionId, setPositionId] = useState<PositionId>('rotating_specialist');

  if (!currentUser) return null;

  const positionOptions = getPositionsForRole(role);
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
      cell: (user) => <RoleBadge role={user.role} positionId={user.positionId} />,
      sortable: true,
      sortValue: (user) => getRoleLabel(user.role),
    },
    {
      id: 'position',
      header: 'Puesto',
      cell: (user) => (
        <span className="text-xs">
          {user.positionId ? getPositionName(user.positionId) : '—'}
        </span>
      ),
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
        description="El administrador crea las cuentas y entrega usuario y contraseña. No hay auto-registro."
        actions={
          canManageUsers(currentUser) ? (
            <Button
              onClick={() => {
                setName('');
                setUsername('');
                setEmail('');
                setPassword('demo1234');
                setRole('OPERATOR');
                setPositionId('rotating_specialist');
                setCreateOpen(true);
              }}
            >
              <UserPlus /> Crear usuario
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Usuarios" value={db.users.length} hint="Cuentas registradas" icon={Users} tone="accent" />
        <KpiCard label="Activos" value={active} hint="Con acceso al sistema" icon={UserPlus} tone="success" />
        <KpiCard label="Operadores" value={operators} hint="Con puesto de taller" icon={Users} tone="info" />
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
        description="Asigna rol y puesto. Entrega al usuario el nombre de usuario y la contraseña."
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!name.trim() || !username.trim() || !password.trim()) {
                  toast.error('El nombre, el usuario y la contraseña son obligatorios');
                  return;
                }
                const input: NewUserInput = {
                  name: name.trim(),
                  username: username.trim(),
                  password: password.trim(),
                  email: email.trim() || `${username.trim()}@turbopre.com`,
                  role,
                  positionId: positionOptions.length > 0 ? positionId : undefined,
                };
                createUser(input, currentUser.id);
                toast.success('Usuario creado', {
                  description: `Usuario: ${input.username} · Contraseña: ${input.password}`,
                });
                setCreateOpen(false);
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
            <FieldLabel htmlFor="user-password">Contraseña inicial</FieldLabel>
            <Input id="user-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Rol</FieldLabel>
            <Select
              value={role}
              onValueChange={(value) => {
                const nextRole = value as RoleId;
                setRole(nextRole);
                const options = getPositionsForRole(nextRole);
                setPositionId(options[0]?.id ?? ('rotating_specialist' as PositionId));
              }}
            >
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
          {positionOptions.length > 0 && (
            <Field>
              <FieldLabel>Puesto de trabajo</FieldLabel>
              <Select value={positionId} onValueChange={(value) => setPositionId(value as PositionId)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {positionOptions.map((position) => (
                    <SelectItem key={position.id} value={position.id}>
                      {position.name} · {POSITION_BY_ID[position.id].shortName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
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
