import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { EmptyState, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getPeople } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export default async function AdminPeoplePage() {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const people = await getPeople();

  return (
    <AppShell user={user}>
      <PageHeader title="Personas" />
      {people.length === 0 ? (
        <EmptyState>No hay personas registradas.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-normal text-slate-600">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Correo</th>
                  <th className="px-4 py-3">Telefono</th>
                  <th className="px-4 py-3">Faltas</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {people.map((person) => (
                  <tr key={person.id}>
                    <td className="px-4 py-3">
                      <Link className="font-medium text-teal-700" href={`/admin/people/${person.id}`}>
                        {person.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{person.email}</td>
                    <td className="px-4 py-3 text-slate-700">{person.phone ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <span
                        className={
                          person.registration_blocked
                            ? "font-semibold text-rose-700"
                            : undefined
                        }
                      >
                        {person.absence_count} / {person.absence_limit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{person.status}</td>
                    <td className="px-4 py-3 text-slate-700">{formatDateTime(person.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
}
