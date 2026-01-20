/* eslint-disable @typescript-eslint/no-explicit-any */
import { initServer, db } from "../../lib/initServer";
import { generateHexId } from "./generateHexID.util";
import type {
  AuditActionType,
  AuditActor,
} from "../../types/Admin/AuditLogger/auditLogger.type";
import { getCurrentDateTime } from "./getDateTime.util";

/**
 * @brief
 * Records an audit log entry in the `audit_logs` table.
 * This function is intended to track significant user or system actions
 */
export async function logAudit(
  actor: AuditActor,
  actionType: AuditActionType,
  description: string,
  meta?: Record<string, any>,
  targetUserId?: string
): Promise<void> {
  await initServer();
  const pool = db();

  const targetId = targetUserId || actor.user_id;

  try {
    await pool.query(
      `INSERT INTO audit_logs (
                id, 
                action_type, 
                actor_user_id, 
                target_user_id,
                actor_email, 
                actor_name, 
                description, 
                meta,
                performed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        generateHexId(36),
        actionType,
        actor.user_id,
        targetId,
        actor.email,
        actor.name,
        description,
        meta ? JSON.stringify(meta) : null,
        getCurrentDateTime(),
      ]
    );
  } catch (error: unknown) {
    console.error("Failed to log audit action:", error);
  }
}
