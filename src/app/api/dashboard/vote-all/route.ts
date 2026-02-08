/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initServer, db } from "../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { logAudit } from "../../../../utils/Variables/AuditLogger.util";
import { AuditActor } from "../../../../types/Admin/AuditLogger/auditLogger.type";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    await initServer();
    const pool = db();

    const now = new Date();
    const currentDay = now.getDay();
    const updatedAt = now.toISOString();

    const [userBots] = await pool.execute<any[]>(
      `SELECT 
        sb.id,
        sb.bot_account_id,
        sb.balance,
        sb.name,
        sb.currency_name,
        ba.user_id,
        b.normal_days,
        b.weekend_days
       FROM selected_bot sb
       INNER JOIN bot_accounts ba ON sb.bot_account_id = ba.id
       INNER JOIN bots b ON sb.name = b.name
       WHERE ba.user_id = ?`,
      [session.user.id]
    );

    if (!Array.isArray(userBots) || userBots.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: "No bots found for this user",
          data: { updated_bots: 0, total_reward: 0 },
        },
        { status: 200 }
      );
    }

    let totalReward = 0;
    const updatePromises = [];

    for (const bot of userBots) {
      const rewardAmount =
        currentDay === 0 || currentDay === 6
          ? bot.weekend_days
          : bot.normal_days;

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

    const actor: AuditActor = {
      user_id: session.user.id,
      email: session.user.email,
      name: session.user.username,
    };

    await logAudit(
      actor,
      "user_action",
      `User triggered vote for all bots (${userBots.length} bots)`,
      {
        user_id: session.user.id,
        total_bots: userBots.length,
        total_reward: totalReward,
        day_type: currentDay === 0 || currentDay === 6 ? "weekend" : "normal",
        day_of_week: currentDay,
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: `Auto-vote completed for ${userBots.length} bots`,
        data: {
          updated_bots: userBots.length,
          total_reward: totalReward,
          day_type: currentDay === 0 || currentDay === 6 ? "weekend" : "normal",
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error in auto-vote:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
