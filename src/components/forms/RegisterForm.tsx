"use client";

import { useActionState } from "react";
import { registerAction } from "@/app/actions/auth";
import { Alert, inputClass, labelClass, SubmitButton } from "@/components/ui";

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, {});

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        {state.error ? <Alert type="error">{state.error}</Alert> : null}
      </div>
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className={labelClass}>Nombre completo</span>
        <input className={inputClass} name="fullName" required />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Cedula</span>
        <input className={inputClass} name="cedula" inputMode="numeric" required />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Telefono</span>
        <input className={inputClass} name="phone" required />
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
        <span className={labelClass}>Fecha de nacimiento</span>
        <input className={inputClass} name="birthDate" type="date" />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Tipo de sangre</span>
        <input className={inputClass} name="bloodType" placeholder="O+" />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>EPS</span>
        <input className={inputClass} name="eps" />
      </label>
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className={labelClass}>Direccion</span>
        <input className={inputClass} name="address" />
      </label>
      <div className="sm:col-span-2">
        <SubmitButton>Crear cuenta</SubmitButton>
      </div>
    </form>
  );
}
