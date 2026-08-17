import { updateAdministratorAction } from "@/app/actions/admins";
import { AppShell } from "@/components/AppShell";
import { AdminForm } from "@/components/forms/AdminForm";
import { PageHeader, SubmitButton } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getAdministrators } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

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
        title="Administradores"
        description={
          params.error === "self"
            ? "No puedes desactivar tu propio usuario."
            : undefined
        }
      />
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Crear administrador</h2>
        <div className="mt-4">
          <AdminForm role={user.role} />
        </div>
      </section>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-normal text-slate-600">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Creado</th>
                <th className="px-4 py-3">Gestion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td className="px-4 py-3 font-medium text-slate-950">{admin.name}</td>
                  <td className="px-4 py-3 text-slate-700">{admin.email}</td>
                  <td className="px-4 py-3 text-slate-700">{admin.role}</td>
                  <td className="px-4 py-3 text-slate-700">{admin.status}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDateTime(admin.created_at)}</td>
                  <td className="px-4 py-3">
                    {user.role === "SUPER_ADMIN" ? (
                      <form action={updateAdministratorAction} className="flex flex-wrap gap-2">
                        <input type="hidden" name="adminId" value={admin.id} />
                        <select
                          name="role"
                          defaultValue={admin.role}
                          className="min-h-10 rounded-md border border-slate-300 bg-white px-2 text-sm"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        </select>
                        <select
                          name="status"
                          defaultValue={admin.status}
                          className="min-h-10 rounded-md border border-slate-300 bg-white px-2 text-sm"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                        </select>
                        <SubmitButton variant="secondary">Guardar</SubmitButton>
                      </form>
                    ) : (
                      <span className="text-sm text-slate-500">SUPER_ADMIN</span>
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
