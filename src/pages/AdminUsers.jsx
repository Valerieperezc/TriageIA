import { useCallback, useEffect, useState } from "react";

import toast from "react-hot-toast";

import { Check, Trash2, UserCheck, Users, X } from "lucide-react";

import { DataState } from "../components/DataState";

import { useAuth } from "../hooks/useAuth";

import { roleLabel } from "../utils/accountProfile";

import { ADMIN_ASSIGNABLE_ROLES } from "../utils/permissions";

import { statusLabel } from "../utils/userAccounts";

import {

  countPendingUsers,

  deleteUser,

  isBuiltInDemoAccount,

  listAllUsers,

  MIGRATION_HINT,

  setUserApproval,

  setUserRole,

} from "../services/userAdminService";



const STATUS_BADGE = {

  pending: "badge-amber",

  approved: "badge-emerald",

  rejected: "badge-red",

};



function formatDate(value) {

  if (!value) return "—";

  try {

    return new Intl.DateTimeFormat("es", {

      dateStyle: "medium",

      timeStyle: "short",

    }).format(new Date(value));

  } catch {

    return "—";

  }

}



export default function AdminUsers() {

  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [needsMigration, setNeedsMigration] = useState(false);

  const [actingId, setActingId] = useState(null);



  const loadUsers = useCallback(async () => {

    setLoading(true);

    setError(null);

    setNeedsMigration(false);

    try {

      const { users: rows, needsMigration: migration } = await listAllUsers();

      setUsers(rows);

      setNeedsMigration(migration);

    } catch (err) {

      setError(err?.message ?? "No se pudo cargar la lista");

      setUsers([]);

    } finally {

      setLoading(false);

    }

  }, []);



  useEffect(() => {

    void loadUsers();

  }, [loadUsers]);



  const handleApproval = async (row, nextStatus) => {

    setActingId(row.id);

    try {

      const updated = await setUserApproval(row.id, nextStatus);

      setUsers((prev) =>

        prev.map((u) => (u.id === updated.id ? updated : u))

      );

      toast.success(

        nextStatus === "approved"

          ? `${updated.email} habilitado. Ya puede iniciar sesión con su correo y contraseña.`

          : `Cuenta de ${updated.email} rechazada`

      );

    } catch (err) {

      toast.error(err?.message ?? "No se pudo actualizar el usuario");

    } finally {

      setActingId(null);

    }

  };



  const handleDelete = async (row) => {
    if (currentUser?.email === row.email) {
      toast.error("No puedes eliminar tu propia cuenta");
      return;
    }

    if (isBuiltInDemoAccount(row.email)) {
      toast.error("No se pueden eliminar las cuentas de demostración");
      return;
    }

    const label = row.displayName || row.email;
    const confirmed = window.confirm(
      `¿Eliminar la cuenta de ${label}?\n\nEsta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setActingId(row.id);
    try {
      await deleteUser(row.id, row.email);
      setUsers((prev) => prev.filter((u) => u.id !== row.id && u.email !== row.email));
      toast.success(`Cuenta de ${row.email} eliminada`);
    } catch (err) {
      toast.error(err?.message ?? "No se pudo eliminar el usuario");
    } finally {
      setActingId(null);
    }
  };

  const handleRoleChange = async (row, nextRole) => {

    if (nextRole === row.role) return;



    if (

      currentUser?.email === row.email &&

      row.role === "admin" &&

      nextRole !== "admin"

    ) {

      const confirmed = window.confirm(

        "Vas a quitar tu propio rol de administrador. ¿Continuar?"

      );

      if (!confirmed) return;

    }



    setActingId(row.id);

    try {

      const updated = await setUserRole(row.id, nextRole);

      setUsers((prev) =>

        prev.map((u) => (u.id === updated.id ? updated : u))

      );

      toast.success(`Rol de ${updated.email} actualizado a ${roleLabel(updated.role)}`);

    } catch (err) {

      toast.error(err?.message ?? "No se pudo cambiar el rol");

    } finally {

      setActingId(null);

    }

  };



  const pendingCount = countPendingUsers(users);

  const roleSelectDisabled = needsMigration || actingId !== null;



  return (

    <DataState loading={loading} error={error} onRetry={loadUsers}>

      <div className="space-y-5">

        <div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-700 dark:border-brand-800/60 dark:bg-brand-950/50 dark:text-brand-200">

            <UserCheck className="h-3 w-3" />

            Administración

          </span>

          <h1 className="page-title mt-2">Usuarios</h1>

          <p className="page-subtitle mt-1">

            Aprueba, rechaza, cambia roles o elimina cuentas desde este panel.

          </p>

          {pendingCount > 0 && (

            <p className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-300">

              {pendingCount} cuenta(s) pendiente(s) de aprobación

            </p>

          )}

          {needsMigration && (

            <div

              className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100"

              role="alert"

              data-testid="admin-users-migration-hint"

            >

              <p className="font-medium">Migración de base de datos pendiente</p>

              <p className="mt-1 text-amber-800 dark:text-amber-200/90">

                {MIGRATION_HINT} Mientras tanto, todos los usuarios aparecen como

                aprobados y no podrás confirmar solicitudes nuevas.

              </p>

            </div>

          )}

        </div>



        {users.length === 0 ? (

          <div className="card text-center text-sm text-ink-500 dark:text-ink-400">

            No hay usuarios registrados.

          </div>

        ) : (

          <div className="card overflow-hidden p-0">

            <div className="overflow-x-auto">

              <table className="w-full min-w-[720px] text-left text-sm">

                <thead>

                  <tr className="border-b border-ink-100 bg-ink-50/80 text-xs font-semibold uppercase tracking-wide text-ink-500 dark:border-ink-800 dark:bg-ink-900/50 dark:text-ink-400">

                    <th className="px-4 py-3">Usuario</th>

                    <th className="px-4 py-3">Rol</th>

                    <th className="px-4 py-3">Estado</th>

                    <th className="px-4 py-3">Registro</th>

                    <th className="px-4 py-3 text-right">Acciones</th>

                  </tr>

                </thead>

                <tbody>

                  {users.map((row) => (

                    <tr

                      key={row.id}

                      className="border-b border-ink-100 last:border-0 dark:border-ink-800"

                      data-testid={`admin-user-row-${row.email}`}

                    >

                      <td className="px-4 py-3">

                        <p className="font-medium text-ink-900 dark:text-ink-50">

                          {row.displayName || row.email}

                        </p>

                        {row.displayName && (

                          <p className="text-xs text-ink-500 dark:text-ink-400">

                            {row.email}

                          </p>

                        )}

                      </td>

                      <td className="px-4 py-3">

                        <select

                          className="w-full min-w-[9rem] rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50"

                          value={row.role}

                          disabled={roleSelectDisabled || actingId === row.id}

                          aria-label={`Rol de ${row.email}`}

                          data-testid={`admin-user-role-${row.email}`}

                          onChange={(e) => handleRoleChange(row, e.target.value)}

                        >

                          {ADMIN_ASSIGNABLE_ROLES.map((r) => (

                            <option key={r} value={r}>

                              {roleLabel(r)}

                            </option>

                          ))}

                        </select>

                      </td>

                      <td className="px-4 py-3">

                        <span

                          className={`badge ${STATUS_BADGE[row.status] ?? "badge-slate"}`}

                        >

                          {statusLabel(row.status)}

                        </span>

                      </td>

                      <td className="px-4 py-3 text-ink-600 dark:text-ink-300">

                        {formatDate(row.createdAt)}

                      </td>

                      <td className="px-4 py-3">

                        <div className="flex flex-wrap justify-end gap-2">

                          {row.status === "pending" && (

                            <>

                              <button

                                type="button"

                                className="btn-secondary inline-flex items-center gap-1 px-3 py-1.5 text-xs"

                                disabled={actingId === row.id}

                                data-testid={`approve-user-${row.email}`}

                                onClick={() => handleApproval(row, "approved")}

                              >

                                <Check className="h-3.5 w-3.5" />

                                Aprobar

                              </button>

                              <button

                                type="button"

                                className="btn-secondary inline-flex items-center gap-1 px-3 py-1.5 text-xs text-red-700 dark:text-red-300"

                                disabled={actingId === row.id}

                                data-testid={`reject-user-${row.email}`}

                                onClick={() => handleApproval(row, "rejected")}

                              >

                                <X className="h-3.5 w-3.5" />

                                Rechazar

                              </button>

                            </>

                          )}

                          <button

                            type="button"

                            className="btn-secondary inline-flex items-center gap-1 px-3 py-1.5 text-xs text-red-700 dark:text-red-300"

                            disabled={

                              actingId === row.id ||

                              currentUser?.email === row.email ||

                              isBuiltInDemoAccount(row.email)

                            }

                            title={

                              currentUser?.email === row.email

                                ? "No puedes eliminar tu propia cuenta"

                                : isBuiltInDemoAccount(row.email)

                                  ? "Cuenta de demostración"

                                  : "Eliminar usuario"

                            }

                            data-testid={`delete-user-${row.email}`}

                            onClick={() => handleDelete(row)}

                          >

                            <Trash2 className="h-3.5 w-3.5" />

                            Eliminar

                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        )}



        <p className="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400">

          <Users className="h-3.5 w-3.5" />

          {users.length} usuario(s) en total · Los cambios de rol aplican en el

          próximo inicio de sesión del usuario

        </p>

      </div>

    </DataState>

  );

}

