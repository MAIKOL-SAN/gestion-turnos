import { updateAdministratorAction } from "@/app/actions/admins";
import { AppShell } from "@/components/AppShell";
import { AdminForm } from "@/components/forms/AdminForm";
import {
  PageHeader,
  SubmitButton,
  inputClass,
  mutedClass,
  sectionTitleClass,
  tableClass,
  tableShellClass,
} from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getAdministrators } from "@/lib/data";
import { formatDateTime, roleLabel } from "@/lib/format";

export default async function AdministratorsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const params = await searchParams;
  const admins = await getAdministrators();

  return (
    <AppShell user={user}>
      <PageHeader
        title="Usuarios administrativos"
        description={
          params.error === "self"
            ? "No puedes desactivar tu propio usuario."
            : "Gestiona administradores y usuarios encargados de pasar lista."
        }
      />
      <section className="app-card">
        <h2 className={sectionTitleClass}>Crear usuario administrativo</h2>
        <div className="mt-4">
          <AdminForm role={user.role} />
        </div>
      </section>
      <section className={tableShellClass}>
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Creado</th>
                <th>Gestion</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td className="font-semibold text-[var(--foreground)]">{admin.name}</td>
                  <td>{admin.email}</td>
                  <td>{roleLabel(admin.role)}</td>
                  <td>{admin.status}</td>
                  <td>{formatDateTime(admin.created_at)}</td>
                  <td>
                    {user.role === "SUPER_ADMIN" ? (
                      <form action={updateAdministratorAction} className="flex flex-wrap gap-2">
                        <input type="hidden" name="adminId" value={admin.id} />
                        <select
                          name="role"
                          defaultValue={admin.role}
                          className={`${inputClass} min-w-40 w-auto`}
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="ATTENDANCE_MANAGER">Pasa lista</option>
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        </select>
                        <select
                          name="status"
                          defaultValue={admin.status}
                          className={`${inputClass} min-w-36 w-auto`}
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                        </select>
                        <SubmitButton variant="secondary">Guardar</SubmitButton>
                      </form>
                    ) : (
                      <span className={`text-sm ${mutedClass}`}>Solo SUPER_ADMIN</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
