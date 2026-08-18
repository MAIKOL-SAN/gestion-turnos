import type { AttendanceStatus, RegistrationStatus, Role, ShiftStatus } from "@/lib/types";

export const APP_TIME_ZONE = "America/Bogota";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

const colombiaDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "2-digit",
  timeZone: APP_TIME_ZONE,
  year: "numeric",
});

const colombiaTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  second: "2-digit",
  timeZone: APP_TIME_ZONE,
});

export function getColombiaDateString(value = new Date()) {
  const parts = Object.fromEntries(
    colombiaDateFormatter
      .formatToParts(value)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getColombiaTimeString(value = new Date()) {
  const parts = Object.fromEntries(
    colombiaTimeFormatter
      .formatToParts(value)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${parts.hour}:${parts.minute}:${parts.second}`;
}

export function isShiftUpcoming(shiftDate: string, startTime: string, value = new Date()) {
  const today = getColombiaDateString(value);

  if (shiftDate !== today) {
    return shiftDate > today;
  }

  return startTime > getColombiaTimeString(value);
}

export function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00.000Z`));
}

export function formatTime(value: string) {
  return value.slice(0, 5);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: APP_TIME_ZONE,
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
