/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initServer, db } from "../../../../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../auth/[...nextauth]/route";
import { logAudit } from "../../../../../../../utils/Variables/AuditLogger.util";
import { AuditActor } from "../../../../../../../types/Admin/AuditLogger/auditLogger.type";

interface UpdateBalanceRequest {
  bot_id: string;
  balance: number;
}

export async function PUT(
  request: Request,
  context: {
    params: Promise<{ account_id: string }>;
  }
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

    const body: UpdateBalanceRequest = await request.json();
    const { bot_id, balance } = body;

    if (!bot_id || typeof bot_id !== "string") {
      return NextResponse.json(
        { error: "Bot ID is required and must be a string" },
        { status: 400 }
      );
    }

    if (typeof balance !== "number" || isNaN(balance)) {
      return NextResponse.json(
        { error: "Balance must be a valid number" },
        { status: 400 }
      );
    }

    if (balance < 0) {
      return NextResponse.json(
        { error: "Balance cannot be negative" },
        { status: 400 }
      );
    }

    await initServer();
    const pool = db();

    const [verificationResults] = await pool.execute<any[]>(
      `SELECT 
        sb.id,
        sb.bot_account_id,
        ba.user_id
       FROM selected_bot sb
       INNER JOIN bot_accounts ba ON sb.bot_account_id = ba.id
       WHERE sb.id = ? AND ba.id = ?`,
      [bot_id, accountId]
    );

    if (
      !Array.isArray(verificationResults) ||
      verificationResults.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Bot not found or you don't have permission to update this bot",
        },
        { status: 404 }
      );
    }

    const bot = verificationResults[0];

    if (bot.user_id !== session.user.id) {
      return NextResponse.json(
        {
          error: "Unauthorized - You are not the owner of this bot",
        },
        { status: 403 }
      );
    }

    const updatedAt = new Date().toISOString();

    const [updateResult] = await pool.execute<any[]>(
      `UPDATE selected_bot 
       SET balance = ?, updated_at = ?
       WHERE id = ? AND bot_account_id = ?`,
      [balance, updatedAt, bot_id, accountId]
    );

    if ((updateResult as any).affectedRows === 0) {
      return NextResponse.json(
        { error: "Failed to update bot balance" },
        { status: 500 }
      );
    }

    const actor: AuditActor = {
      user_id: session.user.id,
      email: session.user.email,
      name: session.user.username,
    };

    await logAudit(
      actor,
      "user_action",
      `User updated bot (${bot_id}) balance of the account (${account_id})`,
      {
        bot_id: bot_id,
        account_id: accountId,
        new_balance: balance,
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Bot balance updated successfully",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error updating bot balance:", error);

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
