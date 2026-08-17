"use client";

import { useActionState } from "react";
import { createAdministratorAction } from "@/app/actions/admins";
import { Alert, inputClass, labelClass, SubmitButton } from "@/components/ui";
import type { Role } from "@/lib/types";

export function AdminForm({ role }: { role: Role }) {
  const [state, formAction] = useActionState(createAdministratorAction, {});
  const canCreateSuperAdmin = role === "SUPER_ADMIN";

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        {state.error ? <Alert type="error">{state.error}</Alert> : null}
        {state.success ? <Alert type="success">{state.success}</Alert> : null}
      </div>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Nombre</span>
        <input className={inputClass} name="name" required />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Correo</span>
        <input className={inputClass} name="email" type="email" required />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Contrasena</span>
        <input className={inputClass} name="password" type="password" minLength={8} required />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Rol</span>
        <select
          className={inputClass}
          name="role"
          defaultValue="ADMIN"
        >
          <option value="ADMIN">ADMIN</option>
          <option value="ATTENDANCE_MANAGER">Pasa lista</option>
          {canCreateSuperAdmin ? <option value="SUPER_ADMIN">SUPER_ADMIN</option> : null}
        </select>
      </label>
      {!canCreateSuperAdmin ? (
        <p className="text-sm text-slate-500 sm:col-span-2">
          Solo un SUPER_ADMIN puede crear o asignar SUPER_ADMIN.
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <SubmitButton>Crear usuario</SubmitButton>
      </div>
    </form>
  );
}
