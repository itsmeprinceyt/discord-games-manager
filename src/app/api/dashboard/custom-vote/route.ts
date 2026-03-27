/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initServer, db } from "../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { logAudit } from "../../../../utils/Variables/AuditLogger.util";
import { AuditActor } from "../../../../types/Admin/AuditLogger/auditLogger.type";
import { invalidateUserCache } from "../../../../utils/Redis/invalidateUserRedisData";
import { isUserBanned } from "../../../../utils/Variables/getUserBanned";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const banned = await isUserBanned();
    if (banned) {
      return NextResponse.json(
        { error: "You are banned. Contact admin" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { account_ids } = body;

    if (!Array.isArray(account_ids) || account_ids.length === 0) {
      return NextResponse.json(
        { error: "No account IDs provided" },
        { status: 400 }
      );
    }

    await initServer();
    const pool = db();

    const now = new Date();
    const utcDay = now.getUTCDay();
    const updatedAt = now.toISOString();

    // Build placeholders for the IN clause
    const placeholders = account_ids.map(() => "?").join(", ");

    const [userBots] = await pool.execute<any[]>(
      `SELECT 
        sb.id,
        sb.bot_account_id,
        sb.balance,
        sb.name,
        sb.currency_name,
        sb.blacklisted,
        ba.user_id,
        b.normal_days,
        b.weekend_days
       FROM selected_bot sb
       INNER JOIN bot_accounts ba ON sb.bot_account_id = ba.id
       INNER JOIN bots b ON sb.name = b.name
       WHERE ba.user_id = ? 
         AND ba.id IN (${placeholders})
         AND (sb.blacklisted = FALSE OR sb.blacklisted IS NULL)`,
      [session.user.id, ...account_ids]
    );

    if (!Array.isArray(userBots) || userBots.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: "No active bots found for the selected accounts",
          data: { updated_bots: 0, total_reward: 0 },
        },
        { status: 200 }
      );
    }

    let totalReward = 0;
    const updatePromises = [];

    for (const bot of userBots) {
      const rewardAmount =
        utcDay === 0 || utcDay === 6 ? bot.weekend_days : bot.normal_days;

      const newBalance = (bot.balance || 0) + rewardAmount;
      totalReward += rewardAmount;

      updatePromises.push(
        pool.execute(
          `UPDATE selected_bot 
           SET balance = ?, voted_at = ?, updated_at = ?
           WHERE id = ?`,
          [newBalance, updatedAt, updatedAt, bot.id]
        )
      );
    }

    await Promise.all(updatePromises);
    await invalidateUserCache(session.user.id);

    const actor: AuditActor = {
      user_id: session.user.id,
      email: session.user.email,
      name: session.user.username,
    };

    await logAudit(
      actor,
      "vote_trigger",
      `@${actor.name} triggered Custom Vote for ${userBots.length} active bot(s)`,
      {
        user_id: session.user.id,
        selected_account_ids: account_ids,
        total_bots: userBots.length,
        total_reward: totalReward,
        day_type: utcDay === 0 || utcDay === 6 ? "weekend" : "normal",
        day_of_week_utc: utcDay,
        timestamp_utc: updatedAt,
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: `Custom vote completed for ${userBots.length} active bots`,
        data: {
          updated_bots: userBots.length,
          total_reward: totalReward,
          day_type: utcDay === 0 || utcDay === 6 ? "weekend" : "normal",
          day_of_week_utc: utcDay,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error in custom-vote:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
