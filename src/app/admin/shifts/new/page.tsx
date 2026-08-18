import { AppShell } from "@/components/AppShell";
import { ShiftForm } from "@/components/forms/ShiftForm";
import { PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";

export default async function NewShiftPage() {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN"]);

  return (
    <AppShell user={user}>
      <PageHeader
        title="Crear turno"
        description="Define fecha, horario, cupo y estado inicial del turno."
      />
      <div className="app-card">
        <ShiftForm />
      </div>
    </AppShell>
  );
}
