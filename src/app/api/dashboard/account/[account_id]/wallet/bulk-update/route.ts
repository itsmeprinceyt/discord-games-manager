/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initServer, db } from "../../../../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../auth/[...nextauth]/route";
import { logAudit } from "../../../../../../../utils/Variables/AuditLogger.util";
import { AuditActor } from "../../../../../../../types/Admin/AuditLogger/auditLogger.type";
import { invalidateUserCache } from "../../../../../../../utils/Redis/invalidateUserRedisData";

interface UpdateBalanceRequest {
  bot_id: string;
  balance: number;
}

interface BulkUpdateRequest {
  updates: UpdateBalanceRequest[];
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

    const body: BulkUpdateRequest = await request.json();
    const { updates } = body;

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: "Updates array is required" },
        { status: 400 }
      );
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "At least one update is required" },
        { status: 400 }
      );
    }

    if (updates.length > 50) {
      return NextResponse.json(
        { error: "Cannot update more than 50 bots at once" },
        { status: 400 }
      );
    }

    const validationErrors: string[] = [];
    updates.forEach((update, index) => {
      if (!update.bot_id || typeof update.bot_id !== "string") {
        validationErrors.push(
          `Update ${index + 1}: Bot ID is required and must be a string`
        );
      }
      if (typeof update.balance !== "number" || isNaN(update.balance)) {
        validationErrors.push(
          `Update ${index + 1}: Balance must be a valid number`
        );
      }
      if (update.balance < 0) {
        validationErrors.push(
          `Update ${index + 1}: Balance cannot be negative`
        );
      }
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    await initServer();
    const pool = db();

    const botIds = updates.map((u) => u.bot_id);
    const placeholders = botIds.map(() => "?").join(",");
    const [verificationResults] = await pool.execute<any[]>(
      `SELECT 
        sb.id,
        sb.bot_account_id,
        sb.name,
        sb.balance as current_balance,
        sb.blacklisted,
        ba.user_id,
        ba.name as account_name
      FROM selected_bot sb
      INNER JOIN bot_accounts ba ON sb.bot_account_id = ba.id
      WHERE sb.id IN (${placeholders}) AND ba.id = ?`,
      [...botIds, accountId]
    );

    if (
      !Array.isArray(verificationResults) ||
      verificationResults.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "No bots found or you don't have permission to update these bots",
        },
        { status: 404 }
      );
    }

    const foundBotIds = verificationResults.map((bot: any) => bot.id);
    const missingBotIds = botIds.filter((id) => !foundBotIds.includes(id));

    if (missingBotIds.length > 0) {
      return NextResponse.json(
        {
          error: "Some bots were not found or you don't have permission",
          missing_bot_ids: missingBotIds,
        },
        { status: 404 }
      );
    }

    const unauthorizedBots = verificationResults.filter(
      (bot: any) => bot.user_id !== session.user.id
    );

    if (unauthorizedBots.length > 0) {
      return NextResponse.json(
        {
          error: "Unauthorized - You don't own some of these bots",
          unauthorized_bot_ids: unauthorizedBots.map((b: any) => b.id),
        },
        { status: 403 }
      );
    }

    const blacklistedBots = verificationResults.filter(
      (bot: any) => bot.blacklisted === true || bot.blacklisted === 1
    );

    if (blacklistedBots.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot update blacklisted bots",
          details: "Blacklisted bots cannot be modified",
          blacklisted_bot_ids: blacklistedBots.map((b: any) => b.id),
          blacklisted_bot_names: blacklistedBots.map((b: any) => b.name),
        },
        { status: 403 }
      );
    }

    const botVerificationMap = new Map(
      verificationResults.map((bot: any) => [bot.id, bot])
    );

    const updateMap = new Map(updates.map((u) => [u.bot_id, u]));
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const updatedAt = new Date().toISOString();
      const updateResults = [];
      const failedUpdates = [];

      for (const botId of foundBotIds) {
        const update = updateMap.get(botId)!;
        const bot = botVerificationMap.get(botId)!;

        try {
          const [updateResult] = await connection.execute<any[]>(
            `UPDATE selected_bot 
             SET balance = ?, updated_at = ?
             WHERE id = ? AND bot_account_id = ?`,
            [update.balance, updatedAt, botId, accountId]
          );

          if ((updateResult as any).affectedRows > 0) {
            updateResults.push({
              bot_id: botId,
              bot_name: bot.name,
              old_balance: bot.current_balance,
              new_balance: update.balance,
              success: true,
            });
          } else {
            failedUpdates.push({
              bot_id: botId,
              bot_name: bot.name,
              error: "Failed to update bot balance",
            });
          }
        } catch (error) {
          failedUpdates.push({
            bot_id: botId,
            bot_name: bot.name,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      if (failedUpdates.length > 0) {
        await connection.rollback();
        return NextResponse.json(
          {
            success: false,
            error: "Some updates failed",
            failed_updates: failedUpdates,
            successful_updates: updateResults,
          },
          { status: 500 }
        );
      }

      await connection.commit();
      await invalidateUserCache(session.user.id);

      const actor: AuditActor = {
        user_id: session.user.id,
        email: session.user.email,
        name: session.user.username,
      };

      await logAudit(
        actor,
        "wallet_update",
        `@${actor.name} performed bulk balance update on account (${verificationResults[0].account_name} - #${accountId})`
      );

      return NextResponse.json(
        {
          success: true,
          message: `Successfully updated ${updateResults.length} bot(s)`,
          data: {
            updated_bots: updateResults,
            total_updated: updateResults.length,
          },
        },
        { status: 200 }
      );
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: unknown) {
    console.error("Error performing bulk balance update:", error);

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
