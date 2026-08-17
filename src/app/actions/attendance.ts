"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { formNumber, formString } from "@/lib/form";
import { query } from "@/lib/db";

function safeReturnTo(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/attendance";
}

export async function updateAbsenceLimitAction(formData: FormData) {
  const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const limit = formNumber(formData, "absenceLimit");

  if (!Number.isInteger(limit) || limit < 0 || limit > 100) {
    redirect("/attendance?error=limit");
  }

  await query(
    `insert into app_settings (key, value, updated_by, updated_at)
     values ('max_absences_before_block', $1, $2, now())
     on conflict (key) do update set
       value = excluded.value,
       updated_by = excluded.updated_by,
       updated_at = now()`,
    [String(limit), admin.id],
  );

  await logAudit(admin.id, "ADMIN_UPDATED_ABSENCE_LIMIT", "SETTING", null, {
    limit,
  });

  revalidatePath("/attendance");
  revalidatePath("/admin/people");
  redirect("/attendance?updated=limit");
}

export async function unlockPersonAttendanceAction(formData: FormData) {
  const actor = await requireRole(["ADMIN", "SUPER_ADMIN", "ATTENDANCE_MANAGER"]);
  const personId = formString(formData, "personId");
  const returnTo = safeReturnTo(formString(formData, "returnTo"));

  const result = await query<{ id: string }>(
    `update person_profiles pp
     set absence_unlocked_at = now(),
         updated_at = now()
     from users u
     where pp.user_id = u.id
       and u.id = $1
       and u.role = 'PERSON'
     returning u.id`,
    [personId],
  );

  if (!result.rows[0]) {
    redirect(`${returnTo}?error=person`);
  }

  await logAudit(actor.id, "ATTENDANCE_UNLOCKED_PERSON", "USER", personId);

  revalidatePath("/attendance");
  revalidatePath(`/admin/people/${personId}`);
  revalidatePath("/admin/people");
  redirect(`${returnTo}?updated=unlock`);
}
