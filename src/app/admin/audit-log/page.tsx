import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getAuditLogs } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export default async function AuditLogPage() {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const logs = await getAuditLogs();

  return (
    <AppShell user={user}>
      <PageHeader title="Auditoria" />
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-normal text-slate-600">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Accion</th>
                <th className="px-4 py-3">Entidad</th>
                <th className="px-4 py-3">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 text-slate-700">{formatDateTime(log.created_at)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-950">{log.actor_name ?? "-"}</p>
                    <p className="text-xs text-slate-500">{log.actor_email ?? ""}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{log.action}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {log.entity_type} {log.entity_id ? `· ${log.entity_id.slice(0, 8)}` : ""}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <code className="text-xs">{JSON.stringify(log.metadata ?? {})}</code>
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
