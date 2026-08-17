"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Alert, inputClass, labelClass, SubmitButton } from "@/components/ui";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? <Alert type="error">{state.error}</Alert> : null}
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Correo</span>
        <input className={inputClass} name="email" type="email" required />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Contrasena</span>
        <input className={inputClass} name="password" type="password" required />
      </label>
      <SubmitButton>Entrar</SubmitButton>
    </form>
  );
}
