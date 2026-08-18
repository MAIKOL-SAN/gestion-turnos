import { AppShell } from "@/components/AppShell";
import { PageHeader, tableClass, tableShellClass } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getAuditLogs } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export default async function AuditLogPage() {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const logs = await getAuditLogs();

  return (
    <AppShell user={user}>
      <PageHeader
        title="Auditoria"
        description="Registro de cambios y acciones importantes del sistema."
      />
      <div className={tableShellClass}>
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Accion</th>
                <th>Entidad</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDateTime(log.created_at)}</td>
                  <td>
                    <p className="font-semibold text-[var(--foreground)]">
                      {log.actor_name ?? "-"}
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      {log.actor_email ?? ""}
                    </p>
                  </td>
                  <td>{log.action}</td>
                  <td>
                    {log.entity_type} {log.entity_id ? `- ${log.entity_id.slice(0, 8)}` : ""}
                  </td>
                  <td>
                    <code className="rounded bg-[var(--surface-soft)] px-1.5 py-1 text-xs text-[var(--foreground-soft)]">
                      {JSON.stringify(log.metadata ?? {})}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
