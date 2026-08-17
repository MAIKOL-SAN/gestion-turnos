import "server-only";
import type { PoolClient } from "pg";
import { query } from "@/lib/db";

export async function logAudit(
  actorUserId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata?: Record<string, unknown>,
) {
  await query(
    `insert into audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
     values ($1, $2, $3, $4, $5::jsonb)`,
    [
      actorUserId,
      action,
      entityType,
      entityId,
      JSON.stringify(metadata ?? {}),
    ],
  );
}

export async function logAuditTx(
  client: PoolClient,
  actorUserId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata?: Record<string, unknown>,
) {
  await client.query(
    `insert into audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
     values ($1, $2, $3, $4, $5::jsonb)`,
    [
      actorUserId,
      action,
      entityType,
      entityId,
      JSON.stringify(metadata ?? {}),
    ],
  );
}
