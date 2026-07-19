"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  LayoutDashboard,
  LogOut,
  Pencil,
  Plus,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
  UserRoundCheck,
  Users,
} from "lucide-react";

import type { Role, User } from "@/lib/types";
import type { RootState } from "@/store";
import { logout } from "@/store/authSlice";
import {
  createRole,
  deleteRole,
  fetchRoles,
  updateRole,
} from "@/store/rolesSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createUser,
  deleteUser,
  fetchUsers,
  updateUser,
} from "@/store/usersSlice";

import { ConfirmDialog, Modal } from "./Modal";

type Tab = "users" | "roles";
const protectedRoles = new Set(["admin", "manager", "viewer"]);

export function AdminDashboard() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const usersState = useAppSelector((state) => state.users);
  const rolesState = useAppSelector((state) => state.roles);
  const [tab, setTab] = useState<Tab>("users");

  useEffect(() => {
    void dispatch(fetchUsers());
    void dispatch(fetchRoles());
  }, [dispatch]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f8fc] text-slate-900">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-24 top-20 size-80 rounded-full bg-cyan-200/35 blur-3xl" />
        <div className="absolute right-0 top-0 size-96 rounded-full bg-violet-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-96 rounded-full bg-emerald-200/25 blur-3xl" />
      </div>

      <aside className="fixed inset-y-5 left-5 z-30 hidden w-64 flex-col rounded-[28px] border border-white/80 bg-white/65 p-5 shadow-[0_20px_60px_rgba(71,85,105,0.12)] backdrop-blur-2xl lg:flex">
        <Brand />
        <nav className="mt-10 space-y-2">
          <NavButton active={tab === "users"} onClick={() => setTab("users")}>
            <Users size={18} /> Users
          </NavButton>
          <NavButton active={tab === "roles"} onClick={() => setTab("roles")}>
            <ShieldCheck size={18} /> Roles
          </NavButton>
        </nav>
        <div className="mt-auto rounded-2xl border border-white bg-white/70 p-4 shadow-sm">
          <p className="truncate text-sm font-semibold">{currentUser?.full_name}</p>
          <p className="truncate text-xs text-slate-500">{currentUser?.email}</p>
          <button
            onClick={() => dispatch(logout())}
            className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-rose-600"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="relative pb-24 lg:pl-[300px] lg:pb-0">
        <header className="sticky top-0 z-20 border-b border-white/70 bg-white/55 px-4 py-4 backdrop-blur-2xl sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="lg:hidden"><Brand compact /></div>
              <div className="hidden lg:block">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">
                  <Sparkles size={14} /> Control center
                </p>
                <h1 className="mt-1 text-2xl font-bold">Administration</h1>
              </div>
            </div>
            <button
              onClick={() => dispatch(logout())}
              className="rounded-xl border border-white bg-white/70 p-2.5 text-slate-500 shadow-sm transition hover:text-rose-600 lg:hidden"
              aria-label="Sign out"
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-10">
          <div className="mb-6 lg:hidden">
            <p className="text-sm font-medium text-teal-600">Administration</p>
            <h1 className="text-2xl font-bold">
              {tab === "users" ? "User management" : "Role management"}
            </h1>
          </div>
          {tab === "users" ? (
            <UsersPanel usersState={usersState} roles={rolesState.items} />
          ) : (
            <RolesPanel />
          )}
        </main>
      </div>

      <nav className="fixed inset-x-4 bottom-4 z-40 grid grid-cols-2 rounded-2xl border border-white/80 bg-white/75 p-2 shadow-[0_16px_50px_rgba(71,85,105,0.2)] backdrop-blur-2xl lg:hidden">
        <NavButton active={tab === "users"} onClick={() => setTab("users")}>
          <Users size={18} /> Users
        </NavButton>
        <NavButton active={tab === "roles"} onClick={() => setTab("roles")}>
          <ShieldCheck size={18} /> Roles
        </NavButton>
      </nav>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/20">
        <Store size={22} />
      </span>
      {!compact && (
        <div>
          <p className="font-bold">Valaiyagam</p>
          <p className="text-xs text-slate-500">Commerce admin</p>
        </div>
      )}
    </div>
  );
}

function NavButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition lg:justify-start ${
        active
          ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/20"
          : "text-slate-500 hover:bg-white/80 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

function UsersPanel({
  usersState,
  roles,
}: {
  usersState: RootState["users"];
  roles: Role[];
}) {
  const dispatch = useAppDispatch();
  const [formUser, setFormUser] = useState<User | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await dispatch(deleteUser(deleteTarget.id));
    setDeleting(false);
    if (deleteUser.fulfilled.match(result)) setDeleteTarget(null);
  }

  return (
    <>
      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Total users" value={usersState.items.length} icon={<Users />} color="cyan" />
        <Stat
          label="Active users"
          value={usersState.items.filter((user) => user.is_active).length}
          icon={<UserRoundCheck />}
          color="emerald"
        />
        <Stat label="Available roles" value={roles.length} icon={<ShieldCheck />} color="violet" />
      </section>

      <section className="glass-panel overflow-hidden">
        <PanelHeader
          title="User management"
          description="Create, edit and control role-based user access"
          action={
            <button onClick={() => setFormUser("new")} className="primary-button">
              <Plus size={17} /> Add user
            </button>
          }
        />
        {usersState.error && <ErrorBanner message={usersState.error} />}

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-white/80 bg-white/35 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Roles</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/80">
              {usersState.items.map((user) => (
                <tr key={user.id} className="transition hover:bg-white/45">
                  <td className="px-6 py-4"><UserIdentity user={user} /></td>
                  <td className="px-6 py-4"><RoleBadges roles={user.roles} /></td>
                  <td className="px-6 py-4"><StatusBadge active={user.is_active} /></td>
                  <td className="px-6 py-4">
                    <ActionButtons
                      editLabel={`Edit ${user.full_name}`}
                      deleteLabel={`Delete ${user.full_name}`}
                      onEdit={() => setFormUser(user)}
                      onDelete={() => setDeleteTarget(user)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 p-4 md:hidden">
          {usersState.items.map((user) => (
            <article key={user.id} className="rounded-2xl border border-white/90 bg-white/55 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <UserIdentity user={user} />
                <StatusBadge active={user.is_active} />
              </div>
              <div className="mt-4"><RoleBadges roles={user.roles} /></div>
              <div className="mt-4 border-t border-slate-200/70 pt-3">
                <ActionButtons
                  editLabel={`Edit ${user.full_name}`}
                  deleteLabel={`Delete ${user.full_name}`}
                  onEdit={() => setFormUser(user)}
                  onDelete={() => setDeleteTarget(user)}
                />
              </div>
            </article>
          ))}
        </div>

        {!usersState.loading && usersState.items.length === 0 && (
          <EmptyState message="No users found. Create your first user." />
        )}
      </section>

      <UserFormModal
        user={formUser}
        roles={roles}
        onClose={() => setFormUser(null)}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete user?"
        message={`This will permanently remove ${deleteTarget?.full_name ?? "this user"} and their role assignments. This action cannot be undone.`}
        busy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}

function UserFormModal({
  user,
  roles,
  onClose,
}: {
  user: User | "new" | null;
  roles: Role[];
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const editing = user !== null && user !== "new";
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    is_active: true,
    role_ids: [] as number[],
  });

  useEffect(() => {
    if (!user) return;
    setForm(
      user === "new"
        ? { full_name: "", email: "", password: "", is_active: true, role_ids: [] }
        : {
            full_name: user.full_name,
            email: user.email,
            password: "",
            is_active: user.is_active,
            role_ids: user.roles.map((role) => role.id),
          },
    );
  }, [user]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const result =
      user === "new"
        ? await dispatch(
            createUser({
              full_name: form.full_name,
              email: form.email,
              password: form.password,
              role_ids: form.role_ids,
            }),
          )
        : user
          ? await dispatch(
              updateUser({
                id: user.id,
                changes: {
                  full_name: form.full_name,
                  is_active: form.is_active,
                  role_ids: form.role_ids,
                  ...(form.password ? { password: form.password } : {}),
                },
              }),
            )
          : null;
    setBusy(false);
    if (
      result &&
      (createUser.fulfilled.match(result) || updateUser.fulfilled.match(result))
    ) {
      onClose();
    }
  }

  function toggleRole(roleId: number) {
    setForm((current) => ({
      ...current,
      role_ids: current.role_ids.includes(roleId)
        ? current.role_ids.filter((id) => id !== roleId)
        : [...current.role_ids, roleId],
    }));
  }

  return (
    <Modal
      open={Boolean(user)}
      title={editing ? "Edit user" : "Create user"}
      description={editing ? "Update account details, status and access roles." : "Add a new administrator or team member."}
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input className="form-input" required value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} />
          </Field>
          <Field label="Email address">
            <input className="form-input disabled:bg-slate-100/70" type="email" required disabled={editing} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </Field>
          <Field label={editing ? "New password (optional)" : "Password"}>
            <input className="form-input" type="password" required={!editing} minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          </Field>
          {editing && (
            <Field label="Account status">
              <button
                type="button"
                onClick={() => setForm({ ...form, is_active: !form.is_active })}
                className={`form-input flex items-center justify-between ${form.is_active ? "text-emerald-700" : "text-slate-500"}`}
              >
                {form.is_active ? "Active" : "Inactive"}
                <span className={`h-6 w-11 rounded-full p-1 transition ${form.is_active ? "bg-emerald-500" : "bg-slate-300"}`}>
                  <span className={`block size-4 rounded-full bg-white transition ${form.is_active ? "translate-x-5" : ""}`} />
                </span>
              </button>
            </Field>
          )}
        </div>
        <Field label="Assigned roles" hint="Choose one or more roles. New users default to viewer when none is selected.">
          <div className="grid gap-2 sm:grid-cols-2">
            {roles.map((role) => (
              <label key={role.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${form.role_ids.includes(role.id) ? "border-teal-300 bg-teal-50/80" : "border-slate-200 bg-white/60 hover:border-slate-300"}`}>
                <input type="checkbox" className="mt-1 accent-teal-600" checked={form.role_ids.includes(role.id)} onChange={() => toggleRole(role.id)} />
                <span><span className="block text-sm font-semibold">{role.name}</span><span className="text-xs text-slate-500">{role.description || "No description"}</span></span>
              </label>
            ))}
          </div>
        </Field>
        <FormActions busy={busy} submitLabel={editing ? "Save changes" : "Create user"} onCancel={onClose} />
      </form>
    </Modal>
  );
}

function RolesPanel() {
  const dispatch = useAppDispatch();
  const rolesState = useAppSelector((state) => state.roles);
  const [formRole, setFormRole] = useState<Role | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await dispatch(deleteRole(deleteTarget.id));
    setDeleting(false);
    if (deleteRole.fulfilled.match(result)) setDeleteTarget(null);
  }

  return (
    <>
      <section className="glass-panel overflow-hidden">
        <PanelHeader
          title="Roles and permissions"
          description="Define access groups and keep permissions organized"
          action={
            <button onClick={() => setFormRole("new")} className="primary-button">
              <Plus size={17} /> Add role
            </button>
          }
        />
        {rolesState.error && <ErrorBanner message={rolesState.error} />}
        <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-2">
          {rolesState.items.map((role) => (
            <article key={role.id} className="rounded-2xl border border-white/90 bg-white/55 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <span className="grid size-11 place-items-center rounded-2xl bg-violet-100 text-violet-600">
                  <ShieldCheck size={21} />
                </span>
                <ActionButtons
                  editLabel={`Edit ${role.name}`}
                  deleteLabel={`Delete ${role.name}`}
                  onEdit={() => setFormRole(role)}
                  onDelete={protectedRoles.has(role.name) ? undefined : () => setDeleteTarget(role)}
                />
              </div>
              <h3 className="mt-4 font-bold capitalize">{role.name.replaceAll("_", " ")}</h3>
              <p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">{role.description || "No description provided."}</p>
              {protectedRoles.has(role.name) && (
                <span className="mt-4 inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-600">System role</span>
              )}
            </article>
          ))}
        </div>
      </section>
      <RoleFormModal role={formRole} onClose={() => setFormRole(null)} />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete role?"
        message={`This will permanently delete the ${deleteTarget?.name ?? ""} role. Roles assigned to users must be removed first.`}
        busy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}

function RoleFormModal({ role, onClose }: { role: Role | "new" | null; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const editing = role !== null && role !== "new";
  const protectedRole = editing && protectedRoles.has(role.name);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!role) return;
    setName(role === "new" ? "" : role.name);
    setDescription(role === "new" ? "" : role.description || "");
  }, [role]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const result =
      role === "new"
        ? await dispatch(createRole({ name, description }))
        : role
          ? await dispatch(updateRole({ id: role.id, changes: { name, description } }))
          : null;
    setBusy(false);
    if (
      result &&
      (createRole.fulfilled.match(result) || updateRole.fulfilled.match(result))
    ) {
      onClose();
    }
  }

  return (
    <Modal open={Boolean(role)} title={editing ? "Edit role" : "Create role"} description="Role names use lowercase letters, numbers, underscores or hyphens." onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <Field label="Role name">
          <input className="form-input disabled:bg-slate-100/70" pattern="[a-z][a-z0-9_-]*" required disabled={protectedRole} value={name} onChange={(event) => setName(event.target.value.toLowerCase())} />
        </Field>
        <Field label="Description">
          <textarea className="form-input min-h-28 resize-y" maxLength={255} value={description} onChange={(event) => setDescription(event.target.value)} />
        </Field>
        <FormActions busy={busy} submitLabel={editing ? "Save changes" : "Create role"} onCancel={onClose} />
      </form>
    </Modal>
  );
}

function PanelHeader({ title, description, action }: { title: string; description: string; action: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div><h2 className="text-lg font-bold">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div>
      {action}
    </div>
  );
}

function UserIdentity({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-100 to-teal-100 font-bold text-teal-700">{user.full_name.slice(0, 1).toUpperCase()}</span>
      <div className="min-w-0"><p className="truncate font-semibold">{user.full_name}</p><p className="truncate text-xs text-slate-500 sm:text-sm">{user.email}</p></div>
    </div>
  );
}

function RoleBadges({ roles }: { roles: Role[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.length ? roles.map((role) => <span key={role.id} className="rounded-full border border-teal-100 bg-teal-50/80 px-2.5 py-1 text-xs font-semibold text-teal-700">{role.name}</span>) : <span className="text-xs text-slate-400">No roles</span>}
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{active ? "Active" : "Inactive"}</span>;
}

function ActionButtons({ editLabel, deleteLabel, onEdit, onDelete }: { editLabel: string; deleteLabel: string; onEdit: () => void; onDelete?: () => void }) {
  return (
    <div className="flex justify-end gap-1">
      <button onClick={onEdit} className="icon-button hover:text-teal-600" aria-label={editLabel}><Pencil size={17} /></button>
      {onDelete && <button onClick={onDelete} className="icon-button hover:bg-rose-50 hover:text-rose-600" aria-label={deleteLabel}><Trash2 size={17} /></button>}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>{children}{hint && <span className="mt-2 block text-xs text-slate-500">{hint}</span>}</label>;
}

function FormActions({ busy, submitLabel, onCancel }: { busy: boolean; submitLabel: string; onCancel: () => void }) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-slate-200/70 pt-5 sm:flex-row sm:justify-end">
      <button type="button" onClick={onCancel} className="glass-secondary-button">Cancel</button>
      <button disabled={busy} className="primary-button justify-center">{busy ? "Saving..." : submitLabel}</button>
    </div>
  );
}

function Stat({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: "cyan" | "emerald" | "violet" }) {
  const colors = { cyan: "bg-cyan-100 text-cyan-700", emerald: "bg-emerald-100 text-emerald-700", violet: "bg-violet-100 text-violet-700" };
  return <article className="glass-panel flex items-center gap-4 p-5"><span className={`grid size-12 place-items-center rounded-2xl ${colors[color]}`}>{icon}</span><div><p className="text-2xl font-bold">{value}</p><p className="text-sm text-slate-500">{label}</p></div></article>;
}

function ErrorBanner({ message }: { message: string }) {
  return <p className="mx-4 mb-4 rounded-xl border border-rose-100 bg-rose-50/80 p-3 text-sm text-rose-700 sm:mx-6">{message}</p>;
}

function EmptyState({ message }: { message: string }) {
  return <p className="p-10 text-center text-sm text-slate-500">{message}</p>;
}
