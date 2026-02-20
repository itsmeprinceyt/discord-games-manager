/* eslint-disable @typescript-eslint/no-explicit-any*/
import { NextRequest, NextResponse } from "next/server";
import { initServer, db } from "../../../../../../../lib/initServer";
import { getCurrentDateTime } from "../../../../../../../utils/Variables/getDateTime.util";
import { generateHexId } from "../../../../../../../utils/Variables/generateHexID.util";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../auth/[...nextauth]/route";
import { AuditActor } from "../../../../../../../types/Admin/AuditLogger/auditLogger.type";
import { logAudit } from "../../../../../../../utils/Variables/AuditLogger.util";

interface RequestBody {
  botIds: string[];
  botAccountId: string;
}

/**
 * Updates the selected bots association for a bot account.
 *
 * This endpoint allows users to manage which bots are associated with their bot account.
 * It handles:
 * - Adding new bot associations (creates new selected_bot records)
 * - Removing bot associations (deletes selected_bot records and their crosstrades)
 * - Preserving existing bot associations and their crosstrades
 *
 * Workflow:
 * 1. Authenticate the user session
 * 2. Validate the input parameters
 * 3. Check if the bot account exists and belongs to the user
 * 4. Fetch currently selected bots for the account
 * 5. Determine which bots to add and which to remove
 * 6. For removed bots: delete their selected_bot records and associated crosstrades
 * 7. For new bots: create new selected_bot records
 * 8. Update the bot_accounts table's updated_at timestamp
 * 9. Log audit trail and return response
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 },
      );
    }

    const body: RequestBody = await request.json();
    const { botIds, botAccountId } = body;

    // Validation
    if (!botAccountId) {
      return NextResponse.json(
        { error: "Missing required field: botAccountId" },
        { status: 400 },
      );
    }

    if (!Array.isArray(botIds)) {
      return NextResponse.json(
        { error: "botIds must be an array" },
        { status: 400 },
      );
    }

    await initServer();
    const pool = db();
    const now = getCurrentDateTime();

    // Check if bot account exists and belongs to the user
    const [accountExists] = await pool.execute<any[]>(
      "SELECT id, user_id FROM bot_accounts WHERE id = ?",
      [botAccountId],
    );

    if (!Array.isArray(accountExists) || accountExists.length === 0) {
      return NextResponse.json(
        { error: "Bot account not found" },
        { status: 404 },
      );
    }

    // Optional: Verify the bot account belongs to the authenticated user
    if (accountExists[0].user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized - You don't own this bot account" },
        { status: 403 },
      );
    }

    // Fetch current selected bots with their bot details
    const [currentSelectedBots] = await pool.execute<any[]>(
      `SELECT sb.id as selected_bot_id, sb.name as selected_bot_name, 
              b.id as bot_id, b.name as bot_name, b.currency_name,
              b.normal_days, b.weekend_days
       FROM selected_bot sb
       JOIN bots b ON sb.name = b.name
       WHERE sb.bot_account_id = ?`,
      [botAccountId],
    );

    const currentBotIds = currentSelectedBots.map((bot) => bot.bot_id);

    // Determine bots to remove and bots to add
    const botIdsToRemove = currentBotIds.filter((id) => !botIds.includes(id));
    const botIdsToAdd = botIds.filter((id) => !currentBotIds.includes(id));

    // If no changes, return early
    if (botIdsToRemove.length === 0 && botIdsToAdd.length === 0) {
      const remainingBots = currentSelectedBots.map((bot) => ({
        id: bot.selected_bot_id,
        bot_id: bot.bot_id,
        name: bot.bot_name,
        currency_name: bot.currency_name,
        normal_days: bot.normal_days,
        weekend_days: bot.weekend_days,
      }));

      return NextResponse.json(
        {
          success: true,
          message: "No changes made to bot associations",
          data: {
            total_bots: remainingBots.length,
            added_count: 0,
            removed_count: 0,
            crosstrades_deleted: false,
            bots: remainingBots,
          },
        },
        { status: 200 },
      );
    }

    let crosstradesDeleted = false;

    // Handle removals: Delete selected_bot records and their crosstrades
    if (botIdsToRemove.length > 0) {
      // Get the selected_bot IDs for bots being removed
      const selectedBotsToRemove = currentSelectedBots
        .filter((bot) => botIdsToRemove.includes(bot.bot_id))
        .map((bot) => bot.selected_bot_id);

      if (selectedBotsToRemove.length > 0) {
        const deletePlaceholders = selectedBotsToRemove
          .map(() => "?")
          .join(",");

        // First delete crosstrades associated with these selected_bots
        await pool.execute(
          `DELETE FROM crosstrades WHERE selected_bot_id IN (${deletePlaceholders})`,
          selectedBotsToRemove,
        );

        // Then delete the selected_bot records
        await pool.execute(
          `DELETE FROM selected_bot WHERE id IN (${deletePlaceholders})`,
          selectedBotsToRemove,
        );

        crosstradesDeleted = true;
      }
    }

    let addedBots: any[] = [];
    if (botIdsToAdd.length > 0) {
      const addPlaceholders = botIdsToAdd.map(() => "?").join(",");
      const [botsToAddDetails] = await pool.execute<any[]>(
        `SELECT id, name, currency_name, normal_days, weekend_days 
         FROM bots 
         WHERE id IN (${addPlaceholders})`,
        botIdsToAdd,
      );

      if (
        !Array.isArray(botsToAddDetails) ||
        botsToAddDetails.length !== botIdsToAdd.length
      ) {
        return NextResponse.json(
          { error: "One or more bots not found" },
          { status: 404 },
        );
      }

      // Create new selected_bot records
      addedBots = await Promise.all(
        botsToAddDetails.map(async (bot) => {
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
            ],
          );

          return {
            id: selectedBotId,
            bot_id: bot.id,
            name: bot.name,
            currency_name: bot.currency_name,
            normal_days: bot.normal_days,
            weekend_days: bot.weekend_days,
          };
        }),
      );
    }

    await pool.execute("UPDATE bot_accounts SET updated_at = ? WHERE id = ?", [
      now,
      botAccountId,
    ]);

    const remainingBots = currentSelectedBots
      .filter((bot) => !botIdsToRemove.includes(bot.bot_id))
      .map((bot) => ({
        id: bot.selected_bot_id,
        bot_id: bot.bot_id,
        name: bot.bot_name,
        currency_name: bot.currency_name,
        normal_days: bot.normal_days,
        weekend_days: bot.weekend_days,
      }));

    const allBots = [...remainingBots, ...addedBots];

    const actor: AuditActor = {
      user_id: session.user.id,
      email: session.user.email,
      name: session.user.username,
    };

    const auditDetails: any = {
      user_id: session.user.id,
      total_bots: allBots.length,
      bot_account_updated_at: now,
    };

    if (botIdsToAdd.length > 0) {
      auditDetails.added_bots = botIdsToAdd.length;
      auditDetails.added_bot_names = addedBots.map((bot) => bot.name);
    }

    if (botIdsToRemove.length > 0) {
      auditDetails.removed_bots = botIdsToRemove.length;
      auditDetails.crosstrades_deleted = crosstradesDeleted;
    }

    await logAudit(
      actor,
      "user_action",
      `@${actor.name} updated selected bots for account #${botAccountId} (Added: ${botIdsToAdd.length}, Removed: ${botIdsToRemove.length})`,
      auditDetails,
    );

    let message = "";
    if (botIdsToAdd.length === 0 && botIdsToRemove.length > 0) {
      message = `Removed ${botIdsToRemove.length} bot(s) and their crosstrades from account`;
    } else if (botIdsToAdd.length > 0 && botIdsToRemove.length === 0) {
      message = `Added ${botIdsToAdd.length} new bot(s) to account`;
    } else if (botIdsToAdd.length > 0 && botIdsToRemove.length > 0) {
      message = `Updated account: added ${botIdsToAdd.length} bot(s), removed ${botIdsToRemove.length} bot(s) and their crosstrades`;
    } else {
      message = "No changes made to bot associations";
    }

    return NextResponse.json(
      {
        success: true,
        message,
        data: {
          total_bots: allBots.length,
          added_count: botIdsToAdd.length,
          removed_count: botIdsToRemove.length,
          crosstrades_deleted: crosstradesDeleted,
          bots: allBots,
          bot_account_updated_at: now,
        },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error updating selected bots:", error);

    if (error instanceof Error) {
      if (error.message.includes("foreign key constraint")) {
        return NextResponse.json(
          { error: "Invalid bot account or bot reference" },
          { status: 400 },
        );
      }

      if (error.message.includes("Duplicate entry")) {
        return NextResponse.json(
          { error: "Bot already selected for this account" },
          { status: 409 },
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
