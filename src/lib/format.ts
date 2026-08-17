import type { AttendanceStatus, RegistrationStatus, Role, ShiftStatus } from "@/lib/types";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00`));
}

export function formatTime(value: string) {
  return value.slice(0, 5);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function shiftStatusLabel(status: ShiftStatus) {
  const labels: Record<ShiftStatus, string> = {
    DRAFT: "Borrador",
    OPEN: "Disponible",
    FULL: "Cupo completo",
    CLOSED: "Cerrado",
    CANCELLED: "Cancelado",
    COMPLETED: "Completado",
  };
  return labels[status];
}

export function registrationStatusLabel(status: RegistrationStatus) {
  return status === "CONFIRMED" ? "Confirmada" : "Cancelada";
}

export function attendanceStatusLabel(status: AttendanceStatus) {
  const labels: Record<AttendanceStatus, string> = {
    PENDING: "Pendiente",
    PRESENT: "Presente",
    ABSENT: "Ausente",
    LATE: "Tarde",
  };
  return labels[status];
}

export function roleLabel(role: Role) {
  const labels: Record<Role, string> = {
    PERSON: "Persona",
    ADMIN: "Admin",
    SUPER_ADMIN: "Super admin",
    ATTENDANCE_MANAGER: "Pasa lista",
  };
  return labels[role];
}
