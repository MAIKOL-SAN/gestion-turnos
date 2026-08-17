"use client";

import { useActionState } from "react";
import { createShiftAction, updateShiftAction } from "@/app/actions/shifts";
import { Alert, inputClass, labelClass, SubmitButton } from "@/components/ui";
import type { ShiftSummary } from "@/lib/types";

export function ShiftForm({ shift }: { shift?: ShiftSummary }) {
  const action = shift ? updateShiftAction : createShiftAction;
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {shift ? <input type="hidden" name="shiftId" value={shift.id} /> : null}
      <div className="sm:col-span-2">
        {state.error ? <Alert type="error">{state.error}</Alert> : null}
        {state.success ? <Alert type="success">{state.success}</Alert> : null}
      </div>
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className={labelClass}>Nombre</span>
        <input className={inputClass} name="name" defaultValue={shift?.name ?? ""} required />
      </label>
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className={labelClass}>Descripcion</span>
        <textarea
          className={`${inputClass} min-h-24`}
          name="description"
          defaultValue={shift?.description ?? ""}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Fecha</span>
        <input
          className={inputClass}
          name="shiftDate"
          type="date"
          defaultValue={shift?.shift_date ?? ""}
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Cupo maximo</span>
        <input
          className={inputClass}
          name="maxCapacity"
          type="number"
          min={1}
          defaultValue={shift?.max_capacity ?? 10}
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Hora inicio</span>
        <input
          className={inputClass}
          name="startTime"
          type="time"
          defaultValue={shift?.start_time?.slice(0, 5) ?? ""}
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Hora fin</span>
        <input
          className={inputClass}
          name="endTime"
          type="time"
          defaultValue={shift?.end_time?.slice(0, 5) ?? ""}
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Estado</span>
        <select className={inputClass} name="status" defaultValue={shift?.status ?? "OPEN"}>
          <option value="DRAFT">Borrador</option>
          <option value="OPEN">Disponible</option>
          <option value="FULL">Cupo completo</option>
          <option value="CLOSED">Cerrado</option>
          <option value="CANCELLED">Cancelado</option>
          <option value="COMPLETED">Completado</option>
        </select>
      </label>
      <div className="flex items-end">
        <SubmitButton>{shift ? "Guardar turno" : "Crear turno"}</SubmitButton>
      </div>
    </form>
  );
}
