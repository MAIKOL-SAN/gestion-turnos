"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAudit, logAuditTx } from "@/lib/audit";
import { requireRole, requireUser } from "@/lib/auth";
import { query, withTransaction } from "@/lib/db";
import { formNumber, formString } from "@/lib/form";
import type { FormState } from "@/lib/types";
import { firstZodError, optionalString, shiftSchema } from "@/lib/validation";

async function confirmedCount(shiftId: string) {
  const result = await query<{ count: number }>(
    `select count(*)::int as count
     from shift_registrations
     where shift_id = $1 and status = 'CONFIRMED'`,
    [shiftId],
  );

  return result.rows[0]?.count ?? 0;
}

export async function createShiftAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const parsed = shiftSchema.safeParse({
    name: formString(formData, "name"),
    description: formString(formData, "description"),
    shiftDate: formString(formData, "shiftDate"),
    startTime: formString(formData, "startTime"),
    endTime: formString(formData, "endTime"),
    maxCapacity: formNumber(formData, "maxCapacity"),
    status: formString(formData, "status") || "OPEN",
  });

  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const shiftId = await withTransaction(async (client) => {
    const result = await client.query<{ id: string }>(
      `insert into shifts (
         name,
         description,
         shift_date,
         start_time,
         end_time,
         max_capacity,
         status,
         created_by
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning id`,
      [
        parsed.data.name,
        optionalString(parsed.data.description),
        parsed.data.shiftDate,
        parsed.data.startTime,
        parsed.data.endTime,
        parsed.data.maxCapacity,
        parsed.data.status,
        admin.id,
      ],
    );

    const id = result.rows[0].id;
    await logAuditTx(client, admin.id, "ADMIN_CREATED_SHIFT", "SHIFT", id);
    return id;
  });

  revalidatePath("/admin/shifts");
  redirect(`/admin/shifts/${shiftId}`);
}

export async function updateShiftAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const shiftId = formString(formData, "shiftId");
  const parsed = shiftSchema.safeParse({
    name: formString(formData, "name"),
    description: formString(formData, "description"),
    shiftDate: formString(formData, "shiftDate"),
    startTime: formString(formData, "startTime"),
    endTime: formString(formData, "endTime"),
    maxCapacity: formNumber(formData, "maxCapacity"),
    status: formString(formData, "status") || "OPEN",
  });

  if (!shiftId) {
    return { error: "Turno invalido." };
  }

  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const count = await confirmedCount(shiftId);

  if (parsed.data.maxCapacity < count) {
    return {
      error: `El cupo no puede ser menor que las ${count} personas confirmadas.`,
    };
  }

  try {
    await withTransaction(async (client) => {
      await client.query(
        `update shifts
         set name = $1,
             description = $2,
             shift_date = $3,
             start_time = $4,
             end_time = $5,
             max_capacity = $6,
             status = $7,
             updated_at = now()
         where id = $8`,
        [
          parsed.data.name,
          optionalString(parsed.data.description),
          parsed.data.shiftDate,
          parsed.data.startTime,
          parsed.data.endTime,
          parsed.data.maxCapacity,
          parsed.data.status,
          shiftId,
        ],
      );

      await logAuditTx(client, admin.id, "ADMIN_UPDATED_SHIFT", "SHIFT", shiftId, {
        maxCapacity: parsed.data.maxCapacity,
        status: parsed.data.status,
      });
    });
  } catch {
    return { error: "No fue posible actualizar el turno." };
  }

  revalidatePath(`/admin/shifts/${shiftId}`);
  revalidatePath("/admin/shifts");
  return { success: "Turno actualizado." };
}

export async function changeShiftStatusAction(formData: FormData) {
  const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const shiftId = formString(formData, "shiftId");
  const status = formString(formData, "status");
  const allowed = ["OPEN", "CLOSED", "CANCELLED", "COMPLETED", "DRAFT"];

  if (!allowed.includes(status)) {
    redirect(`/admin/shifts/${shiftId}`);
  }

  await query(
    `update shifts
     set status = $1,
         cancelled_at = case when $1 = 'CANCELLED' then now() else cancelled_at end,
         updated_at = now()
     where id = $2`,
    [status, shiftId],
  );

  await logAudit(admin.id, "ADMIN_CHANGED_SHIFT_STATUS", "SHIFT", shiftId, {
    status,
  });
  revalidatePath(`/admin/shifts/${shiftId}`);
  revalidatePath("/admin/shifts");
  redirect(`/admin/shifts/${shiftId}`);
}

export async function registerForShiftAction(formData: FormData) {
  const user = await requireUser();
  const shiftId = formString(formData, "shiftId");

  if (user.role !== "PERSON") {
    redirect(`/shifts/${shiftId}?error=role`);
  }

  try {
    await withTransaction(async (client) => {
      const shiftResult = await client.query<{
        id: string;
        max_capacity: number;
        status: string;
      }>(
        `select id, max_capacity, status
         from shifts
         where id = $1
         for update`,
        [shiftId],
      );

      const shift = shiftResult.rows[0];

      if (!shift || shift.status !== "OPEN") {
        throw new Error("SHIFT_NOT_OPEN");
      }

      const registrationCountResult = await client.query<{ registered_count: number }>(
        `select count(*)::int as registered_count
         from shift_registrations
         where shift_id = $1 and status = 'CONFIRMED'`,
        [shiftId],
      );
      const registeredCount = registrationCountResult.rows[0]?.registered_count ?? 0;

      if (registeredCount >= shift.max_capacity) {
        throw new Error("SHIFT_FULL");
      }

      await client.query(
        `insert into shift_registrations (person_id, shift_id, status)
         values ($1, $2, 'CONFIRMED')`,
        [user.id, shiftId],
      );

      await logAuditTx(client, user.id, "PERSON_REGISTERED_SHIFT", "SHIFT", shiftId);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    redirect(`/shifts/${shiftId}?error=${message}`);
  }

  revalidatePath(`/shifts/${shiftId}`);
  revalidatePath("/shifts");
  revalidatePath("/my-shifts");
  redirect(`/shifts/${shiftId}?registered=1`);
}

export async function cancelRegistrationAction(formData: FormData) {
  const user = await requireUser();
  const registrationId = formString(formData, "registrationId");
  const shiftId = formString(formData, "shiftId");
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  await withTransaction(async (client) => {
    const result = await client.query<{
      id: string;
      person_id: string;
      shift_id: string;
      shift_date: string;
      status: string;
    }>(
      `select
         sr.id,
         sr.person_id,
         sr.shift_id,
         s.shift_date::text,
         s.status
       from shift_registrations sr
       join shifts s on s.id = sr.shift_id
       where sr.id = $1
       for update of sr`,
      [registrationId],
    );

    const registration = result.rows[0];

    if (!registration) {
      throw new Error("REGISTRATION_NOT_FOUND");
    }

    if (!isAdmin && registration.person_id !== user.id) {
      throw new Error("FORBIDDEN");
    }

    if (!isAdmin && ["CANCELLED", "COMPLETED"].includes(registration.status)) {
      throw new Error("SHIFT_LOCKED");
    }

    await client.query(
      `update shift_registrations
       set status = 'CANCELLED',
           cancelled_at = now(),
           updated_at = now()
       where id = $1 and status = 'CONFIRMED'`,
      [registrationId],
    );

    await logAuditTx(
      client,
      user.id,
      isAdmin ? "ADMIN_CANCELLED_REGISTRATION" : "PERSON_CANCELLED_REGISTRATION",
      "SHIFT_REGISTRATION",
      registrationId,
    );
  });

  revalidatePath(`/shifts/${shiftId}`);
  revalidatePath(`/admin/shifts/${shiftId}`);
  revalidatePath("/my-shifts");
  redirect(isAdmin ? `/admin/shifts/${shiftId}` : `/shifts/${shiftId}?cancelled=1`);
}

export async function updateAttendanceAction(formData: FormData) {
  const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const registrationId = formString(formData, "registrationId");
  const shiftId = formString(formData, "shiftId");
  const attendance = formString(formData, "attendance");
  const allowed = ["PENDING", "PRESENT", "ABSENT", "LATE"];

  if (!allowed.includes(attendance)) {
    redirect(`/admin/shifts/${shiftId}`);
  }

  await query(
    `update shift_registrations
     set attendance_status = $1,
         updated_at = now()
     where id = $2`,
    [attendance, registrationId],
  );

  await logAudit(admin.id, "ADMIN_UPDATED_ATTENDANCE", "SHIFT_REGISTRATION", registrationId, {
    attendance,
  });
  revalidatePath(`/admin/shifts/${shiftId}`);
  redirect(`/admin/shifts/${shiftId}`);
}
