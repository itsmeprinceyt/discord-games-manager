/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initServer, db } from "../../../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { getCurrentDateTime } from "../../../../../../utils/Variables/getDateTime.util";
import { logAudit } from "../../../../../../utils/Variables/AuditLogger.util";
import { AuditActor } from "../../../../../../types/Admin/AuditLogger/auditLogger.type";
import { invalidateUserCache } from "../../../../../../utils/Redis/invalidateUserRedisData";

interface UpdateAccountRequest {
  name: string;
  account_uid?: string | null;
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ account_id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const { account_id } = await context.params;
    const accountId = account_id;

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    const body: UpdateAccountRequest = await request.json();
    const { name, account_uid } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Account name is required and must be a string" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return NextResponse.json(
        { error: "Account name cannot be empty" },
        { status: 400 }
      );
    }

    if (trimmedName.length > 30) {
      return NextResponse.json(
        { error: "Account name must be 30 characters or less" },
        { status: 400 }
      );
    }

    let trimmedUid: string | null = null;
    if (account_uid !== undefined && account_uid !== null) {
      trimmedUid = account_uid.trim();
      if (trimmedUid && trimmedUid.length > 36) {
        return NextResponse.json(
          { error: "Account UID must not exceed 36 characters" },
          { status: 400 }
        );
      }
      if (trimmedUid === "") {
        trimmedUid = null;
      }
    }

    await initServer();
    const pool = db();

    const [accountCheck] = await pool.execute<any[]>(
      `SELECT id, name, account_uid, user_id FROM bot_accounts WHERE id = ? AND user_id = ?`,
      [accountId, session.user.id]
    );

    if (!Array.isArray(accountCheck) || accountCheck.length === 0) {
      return NextResponse.json(
        { error: "Account not found or you don't have permission to edit it" },
        { status: 404 }
      );
    }

    const existingAccount = accountCheck[0];

    if (trimmedUid !== null && trimmedUid !== existingAccount.account_uid) {
      const [existingUidCheck] = await pool.execute<any[]>(
        `SELECT id FROM bot_accounts WHERE user_id = ? AND account_uid = ? AND id != ?`,
        [session.user.id, trimmedUid, accountId]
      );

      if (Array.isArray(existingUidCheck) && existingUidCheck.length > 0) {
        return NextResponse.json(
          {
            error: "Account UID already exists for another account",
            details: "Please use a different UID or leave it empty",
          },
          { status: 409 }
        );
      }
    }

    const now = getCurrentDateTime();

    const finalUid =
      trimmedUid !== undefined ? trimmedUid : existingAccount.account_uid;

    await pool.execute(
      `UPDATE bot_accounts 
       SET name = ?, account_uid = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [trimmedName, finalUid, now, accountId, session.user.id]
    );

    await invalidateUserCache(session.user.id);

    // Log audit
    const actor: AuditActor = {
      user_id: session.user.id,
      email: session.user.email,
      name: session.user.username,
    };

    const changes: any = {};
    if (existingAccount.name !== trimmedName) {
      changes.old_name = existingAccount.name;
      changes.new_name = trimmedName;
    }
    if (existingAccount.account_uid !== finalUid) {
      changes.old_uid = existingAccount.account_uid;
      changes.new_uid = finalUid;
    }

    await logAudit(
      actor,
      "user_action",
      `@${actor.name} updated bot account (${trimmedName} - #${accountId})`,
      {
        account_id: accountId,
        ...changes,
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Account updated successfully",
        data: {
          id: accountId,
          name: trimmedName,
          account_uid: finalUid,
          updated_at: now,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error updating account:", error);

    if (error instanceof Error) {
      if (error.message.includes("JSON")) {
        return NextResponse.json(
          { error: "Invalid request body format" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
