/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { initServer, db } from "../../../../../../../lib/initServer";
import { getCurrentDateTime } from "../../../../../../../utils/Variables/getDateTime.util";
import { generateHexId } from "../../../../../../../utils/Variables/generateHexID.util";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../auth/[...nextauth]/route";
import { AuditActor } from "../../../../../../../types/Admin/AuditLogger/auditLogger.type";
import { logAudit } from "../../../../../../../utils/Variables/AuditLogger.util";

// TODO: put this in a file
interface RequestBody {
  botIds: string[];
  botAccountId: string;
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

    const body: RequestBody = await request.json();
    const { botIds, botAccountId } = body;

    if (!botAccountId) {
      return NextResponse.json(
        { error: "Missing required field: botAccountId" },
        { status: 400 }
      );
    }

    if (!Array.isArray(botIds)) {
      return NextResponse.json(
        { error: "botIds must be an array" },
        { status: 400 }
      );
    }

    await initServer();
    const pool = db();
    const now = getCurrentDateTime();

    const [accountExists] = await pool.execute<any[]>(
      "SELECT id FROM bot_accounts WHERE id = ?",
      [botAccountId]
    );

    if (!Array.isArray(accountExists) || accountExists.length === 0) {
      return NextResponse.json(
        { error: "Bot account not found" },
        { status: 404 }
      );
    }

    await pool.execute("DELETE FROM selected_bot WHERE bot_account_id = ?", [
      botAccountId,
    ]);

    if (botIds.length === 0) {
      const actor: AuditActor = {
        user_id: session.user.id,
        email: session.user.email,
        name: session.user.username,
      };

      await logAudit(
        actor,
        "user_action",
        `User removed all bots from account #${botAccountId}`,
        {
          user_id: session.user.id,
          removed_all_bots: true,
        }
      );

      return NextResponse.json(
        {
          success: true,
          message: "All bots removed from account",
          data: {
            removedAll: true,
            count: 0,
          },
        },
        { status: 200 }
      );
    }

    const placeholders = botIds.map(() => "?").join(",");
    const [botDetails] = await pool.execute<any[]>(
      `SELECT id, name, currency_name, normal_days, weekend_days 
       FROM bots 
       WHERE id IN (${placeholders})`,
      botIds
    );

    if (!Array.isArray(botDetails) || botDetails.length !== botIds.length) {
      return NextResponse.json(
        { error: "One or more bots not found" },
        { status: 404 }
      );
    }

    const insertedBots = await Promise.all(
      botDetails.map(async (bot) => {
        const selectedBotId = generateHexId(12);

        await pool.execute(
          `INSERT INTO selected_bot (
            id, 
            bot_account_id, 
            name, 
            currency_name, 
            balance, 
            normal_days, 
            weekend_days, 
            last_crosstraded_at, 
            voted_at, 
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            selectedBotId,
            botAccountId,
            bot.name,
            bot.currency_name,
            0,
            bot.normal_days,
            bot.weekend_days,
            null,
            null,
            now,
          ]
        );

        return {
          id: selectedBotId,
          bot_id: bot.id,
          name: bot.name,
          currency_name: bot.currency_name,
          normal_days: bot.normal_days,
          weekend_days: bot.weekend_days,
        };
      })
    );

    const actor: AuditActor = {
      user_id: session.user.id,
      email: session.user.email,
      name: session.user.username,
    };

    await logAudit(
      actor,
      "user_action",
      `User updated bots associated with account #${botAccountId} (${insertedBots.length} bots)`,
      {
        user_id: session.user.id,
        bot_count: insertedBots.length,
        bot_names: insertedBots.map((bot) => bot.name),
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: `Updated bots association with this account (${insertedBots.length} bots)`,
        data: {
          count: insertedBots.length,
          bots: insertedBots,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error updating selected bots:", error);

    if (error instanceof Error) {
      if (error.message.includes("foreign key constraint")) {
        return NextResponse.json(
          { error: "Invalid bot account or bot reference" },
          { status: 400 }
        );
      }

      if (error.message.includes("Duplicate entry")) {
        return NextResponse.json(
          { error: "Bot already selected for this account" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
