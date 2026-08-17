import Link from "next/link";
import type { AttendanceStatus, ShiftStatus } from "@/lib/types";
import {
  attendanceStatusLabel,
  registrationStatusLabel,
  shiftStatusLabel,
} from "@/lib/format";

const shiftTone: Record<ShiftStatus, string> = {
  DRAFT: "border-amber-200 bg-amber-50 text-amber-800",
  OPEN: "border-emerald-200 bg-emerald-50 text-emerald-800",
  FULL: "border-rose-200 bg-rose-50 text-rose-800",
  CLOSED: "border-slate-200 bg-slate-100 text-slate-700",
  CANCELLED: "border-zinc-300 bg-zinc-100 text-zinc-700",
  COMPLETED: "border-cyan-200 bg-cyan-50 text-cyan-800",
};

const attendanceTone: Record<AttendanceStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  PRESENT: "border-emerald-200 bg-emerald-50 text-emerald-800",
  ABSENT: "border-rose-200 bg-rose-50 text-rose-800",
  LATE: "border-cyan-200 bg-cyan-50 text-cyan-800",
};

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link
      href={href}
      className={
        variant === "primary"
          ? "inline-flex min-h-10 items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
          : "inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-100"
      }
    >
      {children}
    </Link>
  );
}

export function SubmitButton({
  children,
  formAction,
  variant = "primary",
}: {
  children: React.ReactNode;
  formAction?: (formData: FormData) => void | Promise<void>;
  variant?: "primary" | "secondary" | "danger";
}) {
  const classes = {
    primary:
      "inline-flex min-h-10 items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800",
    secondary:
      "inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-100",
    danger:
      "inline-flex min-h-10 items-center justify-center rounded-md bg-rose-700 px-4 text-sm font-semibold text-white hover:bg-rose-800",
  };

  return (
    <button formAction={formAction} className={classes[variant]} type="submit">
      {children}
    </button>
  );
}

export function StatusBadge({ status }: { status: ShiftStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold ${shiftTone[status]}`}
    >
      {shiftStatusLabel(status)}
    </span>
  );
}

export function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold ${attendanceTone[status]}`}
    >
      {attendanceStatusLabel(status)}
    </span>
  );
}

export function RegistrationBadge({ status }: { status: "CONFIRMED" | "CANCELLED" }) {
  const className =
    status === "CONFIRMED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-slate-200 bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold ${className}`}
    >
      {registrationStatusLabel(status)}
    </span>
  );
}

export function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

export function Alert({
  type,
  children,
}: {
  type: "error" | "success";
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        type === "error"
          ? "rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
          : "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
      }
    >
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
      {children}
    </div>
  );
}

export const inputClass =
  "min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

export const labelClass = "text-sm font-medium text-slate-800";
