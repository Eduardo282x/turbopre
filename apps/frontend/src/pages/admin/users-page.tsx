import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Plus, UserCheck, UserPlus, Users, UserX } from 'lucide-react';
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
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROLE_OPTIONS, getRoleLabel } from '@/features/preview/config';
import {
  mapJobPositionCodeToPositionId,
  useCurrentUser,
} from '@/features/preview/store/preview-session';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate, getInitials } from '@/lib/formatters';
import { canManageUsers } from '@/lib/permissions';
import { catalogsService } from '@/services/catalogs/catalogs.service';
import { usersService } from '@/services/users/users.service';
import type {
  CreateUserInput,
  OrganizationCatalog,
  UpdateUserInput,
  UserListItem,
  UserRole,
} from '@turbopre/shared';

function positionsForRole(
  catalog: OrganizationCatalog | undefined,
  role: UserRole,
) {
  if (!catalog) return [];

  const kind =
    role === 'OPERATOR'
      ? 'WORKSHOP'
      : role === 'ENGINEER'
        ? 'ENGINEERING'
        : role === 'QUALITY'
          ? 'QUALITY'
          : null;

  return kind
    ? catalog.jobPositions.filter((position) => position.processKind === kind)
    : [];
}

export function UsersPage() {
  const currentUser = useCurrentUser();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deactivating, setDeactivating] = useState<UserListItem | null>(null);
  const [resetting, setResetting] = useState<UserListItem | null>(null);
  const [newPassword, setNewPassword] = useState('demo1234');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('demo1234');
  const [role, setRole] = useState<UserRole>('OPERATOR');
  const [jobPositionId, setJobPositionId] = useState('');

  const usersQuery = useQuery({
    queryKey: ['users', 'list'],
    queryFn: () => usersService.list(),
  });

  const catalogsQuery = useQuery({
    queryKey: ['catalogs', 'organization'],
    queryFn: () => catalogsService.getOrganization(),
    staleTime: 5 * 60_000,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateUserInput) => usersService.create(input),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario creado', {
        description: `Usuario: ${created.username} · Contraseña inicial entregada por el administrador.`,
      });
      setCreateOpen(false);
    },
    onError: (error) => {
      toast.error('No se pudo crear el usuario', {
        description: getApiErrorMessage(error),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      usersService.update(id, input),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(updated.isActive ? 'Usuario activado' : 'Usuario desactivado', {
        description: updated.fullName,
      });
      setDeactivating(null);
    },
    onError: (error) => {
      toast.error('No se pudo actualizar el usuario', {
        description: getApiErrorMessage(error),
      });
    },
  });

  const resetMutation = useMutation({
    mutationFn: ({ id, nextPassword }: { id: string; nextPassword: string }) =>
      usersService.resetPassword(id, { password: nextPassword }),
    onSuccess: () => {
      toast.success('Contraseña actualizada', {
        description: 'Entrega la nueva contraseña al usuario por un canal seguro.',
      });
      setResetting(null);
      setNewPassword('demo1234');
    },
    onError: (error) => {
      toast.error('No se pudo cambiar la contraseña', {
        description: getApiErrorMessage(error),
      });
    },
  });

  if (!currentUser) return null;

  const users = usersQuery.data ?? [];
  const active = users.filter((user) => user.isActive).length;
  const operators = users.filter((user) => user.role === 'OPERATOR').length;
  const positionOptions = positionsForRole(catalogsQuery.data, role);
  const needsPosition = ['OPERATOR', 'ENGINEER', 'QUALITY'].includes(role);

  const openCreate = () => {
    resetCreateForm();
    const firstPosition = positionsForRole(catalogsQuery.data, 'OPERATOR')[0]?.id ?? '';
    setJobPositionId(firstPosition);
    setCreateOpen(true);
  };

  const resetCreateForm = () => {
    setFullName('');
    setUsername('');
    setEmail('');
    setPassword('demo1234');
    setRole('OPERATOR');
    setJobPositionId('');
  };

  const changeRole = (value: string) => {
    const nextRole = value as UserRole;
    setRole(nextRole);
    const options = positionsForRole(catalogsQuery.data, nextRole);
    setJobPositionId(options[0]?.id ?? '');
  };

  const submitCreate = () => {
    if (!fullName.trim() || !username.trim() || !password.trim()) {
      toast.error('El nombre, el usuario y la contraseña son obligatorios');
      return;
    }

    if (needsPosition && !jobPositionId) {
      toast.error('Selecciona el puesto de trabajo para este rol');
      return;
    }

    const input: CreateUserInput = {
      fullName: fullName.trim(),
      username: username.trim(),
      password,
      email: email.trim() || null,
      role,
      jobPositionId: needsPosition ? jobPositionId : null,
    };

    createMutation.mutate(input);
  };

  const columns: DataTableColumn<UserListItem>[] = [
    {
      id: 'user',
      header: 'Usuario',
      cell: (user) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-foreground">{user.fullName}</p>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
          </div>
        </div>
      ),
      sortable: true,
      sortValue: (user) => user.fullName,
    },
    {
      id: 'role',
      header: 'Rol',
      cell: (user) => (
        <RoleBadge
          role={user.role}
          positionId={mapJobPositionCodeToPositionId(user.jobPositionCode)}
        />
      ),
      sortable: true,
      sortValue: (user) => getRoleLabel(user.role),
    },
    {
      id: 'position',
      header: 'Puesto',
      cell: (user) => (
        <div className="text-xs">
          <p>{user.jobPositionName ?? '—'}</p>
          {user.processName && (
            <p className="text-muted-foreground">{user.processName}</p>
          )}
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'email',
      header: 'Correo',
      cell: (user) => (
        <span className="text-xs text-muted-foreground">{user.email ?? '—'}</span>
      ),
      hideOnMobile: true,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (user) => (
        <StatusBadge tone={user.isActive ? 'success' : 'danger'} dot>
          {user.isActive ? 'Activo' : 'Inactivo'}
        </StatusBadge>
      ),
    },
    {
      id: 'created',
      header: 'Ingreso',
      cell: (user) => (
        <span className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</span>
      ),
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
        description="El administrador crea las cuentas y entrega usuario y contraseña."
        actions={
          canManageUsers(currentUser) ? (
            <Button onClick={openCreate}>
              <UserPlus /> Crear usuario
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Usuarios"
          value={users.length}
          hint="Cuentas registradas"
          icon={Users}
          tone="accent"
        />
        <KpiCard
          label="Activos"
          value={active}
          hint="Con acceso al sistema"
          icon={UserPlus}
          tone="success"
        />
        <KpiCard
          label="Operadores"
          value={operators}
          hint="Con puesto de taller"
          icon={Users}
          tone="info"
        />
      </div>

      {usersQuery.isError && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {getApiErrorMessage(usersQuery.error, 'No se pudieron cargar los usuarios')}
        </p>
      )}

      <DataTable
        data={users}
        columns={columns}
        getRowId={(user) => user.id}
        isLoading={usersQuery.isLoading}
        search={{
          placeholder: 'Buscar por nombre, usuario, correo o rol…',
          getText: (user) =>
            `${user.fullName} ${user.username} ${user.email ?? ''} ${getRoleLabel(user.role)} ${user.jobPositionName ?? ''}`,
        }}
        actions={[
          {
            label: 'Restablecer contraseña',
            icon: KeyRound,
            onSelect: (user) => {
              setNewPassword('demo1234');
              setResetting(user);
            },
          },
          {
            label: 'Activar',
            icon: UserCheck,
            hidden: (user) => user.isActive || !canManageUsers(currentUser),
            onSelect: (user) =>
              updateMutation.mutate({ id: user.id, input: { isActive: true } }),
          },
          {
            label: 'Desactivar',
            icon: UserX,
            variant: 'destructive',
            hidden: (user) =>
              !user.isActive ||
              user.id === currentUser.id ||
              !canManageUsers(currentUser),
            onSelect: (user) => setDeactivating(user),
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
            <Button onClick={submitCreate} disabled={createMutation.isPending}>
              <Plus /> {createMutation.isPending ? 'Guardando…' : 'Guardar usuario'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="user-name">Nombre completo</FieldLabel>
            <Input
              id="user-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="user-username">Nombre de usuario</FieldLabel>
            <Input
              id="user-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="juan.perez"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="user-email">Correo</FieldLabel>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="user-password">Contraseña inicial</FieldLabel>
            <Input
              id="user-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <FieldDescription>Mínimo 6 caracteres.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>Rol</FieldLabel>
            <Select value={role} onValueChange={changeRole}>
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
          {needsPosition && (
            <Field>
              <FieldLabel>Puesto de trabajo</FieldLabel>
              <Select value={jobPositionId} onValueChange={setJobPositionId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un puesto" />
                </SelectTrigger>
                <SelectContent>
                  {positionOptions.map((position) => (
                    <SelectItem key={position.id} value={position.id}>
                      {position.name} · {position.processName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                El puesto debe pertenecer al área del rol seleccionado.
              </FieldDescription>
            </Field>
          )}
        </div>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deactivating)}
        onOpenChange={(open) => {
          if (!open) setDeactivating(null);
        }}
        title="Desactivar usuario"
        description={`¿Seguro que deseas desactivar a ${deactivating?.fullName ?? 'este usuario'}? Podrás reactivarlo después.`}
        confirmLabel="Sí, desactivar"
        destructive
        onConfirm={() => {
          if (!deactivating) return;
          updateMutation.mutate({
            id: deactivating.id,
            input: { isActive: false },
          });
        }}
      />

      <FormDialog
        open={Boolean(resetting)}
        onOpenChange={(open) => {
          if (!open) setResetting(null);
        }}
        title="Restablecer contraseña"
        description={`Asigna una nueva contraseña a ${resetting?.fullName ?? 'este usuario'}.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setResetting(null)}>
              Cancelar
            </Button>
            <Button
              disabled={resetMutation.isPending || newPassword.length < 6}
              onClick={() => {
                if (!resetting) return;
                resetMutation.mutate({ id: resetting.id, nextPassword: newPassword });
              }}
            >
              <KeyRound /> {resetMutation.isPending ? 'Guardando…' : 'Guardar contraseña'}
            </Button>
          </>
        }
      >
        <Field>
          <FieldLabel htmlFor="reset-password">Nueva contraseña</FieldLabel>
          <Input
            id="reset-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <FieldDescription>Mínimo 6 caracteres.</FieldDescription>
        </Field>
      </FormDialog>
    </div>
  );
}
