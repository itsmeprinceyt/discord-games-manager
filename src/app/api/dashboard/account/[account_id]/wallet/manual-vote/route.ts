/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initServer, db } from "../../../../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../auth/[...nextauth]/route";
import { logAudit } from "../../../../../../../utils/Variables/AuditLogger.util";
import { AuditActor } from "../../../../../../../types/Admin/AuditLogger/auditLogger.type";
import { getCurrentDateTime } from "../../../../../../../utils/Variables/getDateTime.util";

interface AddDailyRewardRequest {
  bot_id: string;
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{ account_id: string }>;
  },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 },
      );
    }

    const { account_id } = await context.params;
    const accountId = account_id;

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 },
      );
    }

    const body: AddDailyRewardRequest = await request.json();
    const { bot_id } = body;

    if (!bot_id || typeof bot_id !== "string") {
      return NextResponse.json(
        { error: "Bot ID is required and must be a string" },
        { status: 400 },
      );
    }

    await initServer();
    const pool = db();

    const [verificationResults] = await pool.execute<any[]>(
      `SELECT 
        sb.id,
        sb.bot_account_id,
        sb.balance,
        sb.name,
        sb.currency_name,
        ba.user_id,
        ba.name as account_name
       FROM selected_bot sb
       INNER JOIN bot_accounts ba ON sb.bot_account_id = ba.id
       WHERE sb.id = ? AND ba.id = ?`,
      [bot_id, accountId],
    );

    if (
      !Array.isArray(verificationResults) ||
      verificationResults.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Account not found or you don't have permission to access this account",
        },
        { status: 404 },
      );
    }

    const bot = verificationResults[0];

    if (bot.user_id !== session.user.id) {
      return NextResponse.json(
        {
          error: "Unauthorized - You are not the owner of this account",
        },
        { status: 403 },
      );
    }

    const [botsResults] = await pool.execute<any[]>(
      `SELECT 
        id,
        name,
        currency_name,
        normal_days,
        weekend_days,
        created_at,
        updated_at
       FROM bots 
       WHERE name = ?`,
      [bot.name],
    );

    if (!Array.isArray(botsResults) || botsResults.length === 0) {
      return NextResponse.json(
        {
          error: "Bot configuration not found in system",
        },
        { status: 404 },
      );
    }

    const botConfig = botsResults[0];

    const now = new Date();
    const utcDay = now.getUTCDay(); // 0 = Sunday, 6 = Saturday in UTC

    let rewardAmount: number;

    // Check if it's weekend in UTC (0 = Sunday, 6 = Saturday)
    if (utcDay === 0 || utcDay === 6) {
      rewardAmount = botConfig.weekend_days;
    } else {
      rewardAmount = botConfig.normal_days;
    }

    const updatedAt = getCurrentDateTime();
    const newBalance = (bot.balance || 0) + rewardAmount;

    const [updateResult] = await pool.execute<any[]>(
      `UPDATE selected_bot 
       SET balance = ?, voted_at = ?, updated_at = ?
       WHERE id = ? AND bot_account_id = ?`,
      [newBalance, updatedAt, updatedAt, bot_id, accountId],
    );

    if ((updateResult as any).affectedRows === 0) {
      return NextResponse.json(
        { error: "Failed to add daily reward to bot balance" },
        { status: 500 },
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
      `@${actor.name} added vote reward manually to bot (${botConfig.name} - #${bot_id}) for account (${bot.account_name} - #${account_id})`,
      {
        bot_id: bot_id,
        account_id: accountId,
        bot_name: bot.name,
        day_type: utcDay === 0 || utcDay === 6 ? "weekend" : "normal",
        day_of_week_utc: utcDay,
        timestamp_utc: updatedAt,
        reward_amount: rewardAmount,
        previous_balance: bot.balance,
        new_balance: newBalance,
      },
    );

    return NextResponse.json(
      {
        success: true,
        message: `Vote reward added for ${bot.name}`,
        data: {
          new_balance: newBalance,
          day_type: utcDay === 0 || utcDay === 6 ? "weekend" : "normal",
          day_of_week_utc: utcDay,
        },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error adding daily reward:", error);

    if (error instanceof Error) {
      if (error.message.includes("JSON")) {
        return NextResponse.json(
          { error: "Invalid request body format" },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
