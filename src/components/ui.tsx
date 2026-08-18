import Link from "next/link";
import type { AttendanceStatus, ShiftStatus } from "@/lib/types";
import {
  attendanceStatusLabel,
  registrationStatusLabel,
  shiftStatusLabel,
} from "@/lib/format";

const shiftTone: Record<ShiftStatus, string> = {
  DRAFT:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200",
  OPEN:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200",
  FULL:
    "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-200",
  CLOSED:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300",
  CANCELLED:
    "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-500/30 dark:bg-zinc-500/10 dark:text-zinc-300",
  COMPLETED:
    "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-200",
};

const attendanceTone: Record<AttendanceStatus, string> = {
  PENDING:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200",
  PRESENT:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200",
  ABSENT:
    "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-200",
  LATE:
    "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-200",
};

const metricTone = {
  brand: "border-[color:var(--brand-header)] bg-[color:color-mix(in_srgb,var(--brand-header)_10%,var(--surface))] text-[var(--brand-header)] dark:text-[var(--brand-accent)]",
  accent:
    "border-[color:var(--brand-accent)] bg-[color:color-mix(in_srgb,var(--brand-accent)_12%,var(--surface))] text-sky-700 dark:text-sky-200",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200",
  warning:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200",
  danger:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-200",
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
    <div className="flex flex-col gap-4 border-b border-[color:var(--border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-normal text-[var(--foreground)] sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--foreground-muted)]">
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
  icon,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link
      href={href}
      className={`app-button ${
        variant === "primary" ? "app-button-primary" : "app-button-secondary"
      }`}
    >
      {icon}
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
    primary: "app-button app-button-primary",
    secondary: "app-button app-button-secondary",
    danger: "app-button app-button-danger",
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
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${shiftTone[status]}`}
    >
      {shiftStatusLabel(status)}
    </span>
  );
}

export function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${attendanceTone[status]}`}
    >
      {attendanceStatusLabel(status)}
    </span>
  );
}

export function RegistrationBadge({ status }: { status: "CONFIRMED" | "CANCELLED" }) {
  const className =
    status === "CONFIRMED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200"
      : "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300";

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {registrationStatusLabel(status)}
    </span>
  );
}

export function Metric({
  icon,
  label,
  tone = "brand",
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  tone?: keyof typeof metricTone;
  value: number | string;
}) {
  return (
    <div className="app-card overflow-hidden p-0">
      <div className="flex items-start justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-[var(--foreground-muted)]">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{value}</p>
        </div>
        {icon ? (
          <div
            className={`inline-flex size-10 items-center justify-center rounded-md border ${metricTone[tone]}`}
          >
            {icon}
          </div>
        ) : null}
      </div>
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
          ? "rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-200"
          : "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200"
      }
    >
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-[color:var(--border-strong)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--foreground-muted)]">
      {children}
    </div>
  );
}

export const cardClass = "app-card";
export const linkClass = "font-semibold text-[var(--brand-header)] hover:text-[var(--brand-accent)] dark:text-[var(--brand-accent)]";
export const mutedClass = "text-[var(--foreground-muted)]";
export const sectionTitleClass = "app-section-title";
export const tableClass = "app-table text-sm";
export const tableShellClass = "app-table-shell overflow-hidden";

export const inputClass = "app-input text-sm";
export const labelClass = "app-label";
