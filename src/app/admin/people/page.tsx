import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import {
  EmptyState,
  PageHeader,
  linkClass,
  tableClass,
  tableShellClass,
} from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getPeople } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export default async function AdminPeoplePage() {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const people = await getPeople();

  return (
    <AppShell user={user}>
      <PageHeader
        title="Personas"
        description="Consulta perfiles, faltas y estado de cada persona registrada."
      />
      {people.length === 0 ? (
        <EmptyState>No hay personas registradas.</EmptyState>
      ) : (
        <div className={tableShellClass}>
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Telefono</th>
                  <th>Faltas</th>
                  <th>Estado</th>
                  <th>Registro</th>
                </tr>
              </thead>
              <tbody>
                {people.map((person) => (
                  <tr key={person.id}>
                    <td>
                      <Link className={linkClass} href={`/admin/people/${person.id}`}>
                        {person.name}
                      </Link>
                    </td>
                    <td>{person.email}</td>
                    <td>{person.phone ?? "-"}</td>
                    <td>
                      <span
                        className={
                          person.registration_blocked
                            ? "font-semibold text-rose-700 dark:text-rose-300"
                            : undefined
                        }
                      >
                        {person.absence_count} / {person.absence_limit}
                      </span>
                    </td>
                    <td>{person.status}</td>
                    <td>{formatDateTime(person.created_at)}</td>
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
