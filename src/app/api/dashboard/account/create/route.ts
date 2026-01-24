/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { initServer, db } from "../../../../../lib/initServer";
import { getCurrentDateTime } from "../../../../../utils/Variables/getDateTime.util";
import { generateHexId } from "../../../../../utils/Variables/generateHexID.util";
import { logAudit } from "../../../../../utils/Variables/AuditLogger.util";
import { AuditActor } from "../../../../../types/Admin/AuditLogger/auditLogger.type";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

// TODO: put in a file
interface BotAccountFormData {
  name: string;
  account_uid?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, account_uid } = body as BotAccountFormData;

    if (!name) {
      return NextResponse.json(
        { error: "Bot account name is required" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const trimmedAccountUid = account_uid ? account_uid.trim() : "";

    if (!trimmedName) {
      return NextResponse.json(
        { error: "Bot account name is required" },
        { status: 400 }
      );
    }

    if (trimmedName.length > 30) {
      return NextResponse.json(
        { error: "Bot account name must be 30 characters or less" },
        { status: 400 }
      );
    }

    if (trimmedAccountUid && trimmedAccountUid.length > 36) {
      return NextResponse.json(
        { error: "Account UID must not exceed 36 characters" },
        { status: 400 }
      );
    }

    await initServer();
    const pool = db();
    const now = getCurrentDateTime();

    const [userExists] = await pool.execute<any[]>(
      "SELECT id FROM users WHERE id = ?",
      [session.user.id]
    );

    if (!Array.isArray(userExists) || userExists.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [existingBotAccounts] = await pool.execute<any[]>(
      "SELECT id FROM bot_accounts WHERE user_id = ? AND name = ?",
      [session.user.id, trimmedName]
    );

    if (Array.isArray(existingBotAccounts) && existingBotAccounts.length > 0) {
      return NextResponse.json(
        {
          error: "A bot account with this name already exists for your account",
        },
        { status: 409 }
      );
    }

    if (trimmedAccountUid) {
      const [existingAccountUid] = await pool.execute<any[]>(
        "SELECT id FROM bot_accounts WHERE account_uid = ?",
        [trimmedAccountUid]
      );

      if (Array.isArray(existingAccountUid) && existingAccountUid.length > 0) {
        return NextResponse.json(
          { error: "This account UID is already in use" },
          { status: 409 }
        );
      }
    }

    const id = generateHexId(12);

    await pool.execute(
      "INSERT INTO bot_accounts (id, user_id, name, account_uid, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      [id, session.user.id, trimmedName, trimmedAccountUid || null, now, now]
    );

    const actor: AuditActor = {
      user_id: session.user.id,
      email: session.user.email,
      name: session.user.username,
    };

    await logAudit(
      actor,
      "game_account_create",
      `Bot account "${trimmedName}" created successfully`,
      {
        bot_account_id: id,
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Bot account created successfully",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Bot account creation error:", error);

    if (error instanceof Error) {
      if (error.message.includes("Duplicate entry")) {
        return NextResponse.json(
          { error: "Bot account with this name or account UID already exists" },
          { status: 409 }
        );
      }

      if (error.message.includes("foreign key constraint fails")) {
        return NextResponse.json(
          { error: "Invalid user reference" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
