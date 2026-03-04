/* eslint-disable @typescript-eslint/no-explicit-any*/
import { NextRequest, NextResponse } from "next/server";
import { initServer, db } from "../../../../../../../lib/initServer";
import { getCurrentDateTime } from "../../../../../../../utils/Variables/getDateTime.util";
import { generateHexId } from "../../../../../../../utils/Variables/generateHexID.util";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../auth/[...nextauth]/route";
import { AuditActor } from "../../../../../../../types/Admin/AuditLogger/auditLogger.type";
import { logAudit } from "../../../../../../../utils/Variables/AuditLogger.util";
import { invalidateUserCache } from "../../../../../../../utils/Redis/invalidateUserRedisData";
import { isUserBanned } from "../../../../../../../utils/Variables/getUserBanned";

interface BlacklistUpdate {
  selectedBotId: string;
  blacklisted: boolean;
}

interface RequestBody {
  botIds: string[];
  botAccountId: string;
  blacklistUpdates?: BlacklistUpdate[];
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

    const banned = await isUserBanned();
    if (banned) {
      return NextResponse.json(
        { error: "You are banned. Contact admin" },
        { status: 403 }
      );
    }

    const body: RequestBody = await request.json();
    const { botIds, botAccountId, blacklistUpdates = [] } = body;

    // Validation
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

    if (!Array.isArray(blacklistUpdates)) {
      return NextResponse.json(
        { error: "blacklistUpdates must be an array" },
        { status: 400 }
      );
    }

    await initServer();
    const pool = db();
    const now = getCurrentDateTime();

    // Check if bot account exists and belongs to the user
    const [accountExists] = await pool.execute<any[]>(
      "SELECT id, name as account_name, user_id FROM bot_accounts WHERE id = ?",
      [botAccountId]
    );

    if (!Array.isArray(accountExists) || accountExists.length === 0) {
      return NextResponse.json(
        { error: "Bot account not found" },
        { status: 404 }
      );
    }

    // Verify the bot account belongs to the authenticated user
    if (accountExists[0].user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized - You don't own this bot account" },
        { status: 403 }
      );
    }

    // Fetch current selected bots with their bot details and blacklist status
    const [currentSelectedBots] = await pool.execute<any[]>(
      `SELECT sb.id as selected_bot_id, sb.name as selected_bot_name, 
              sb.blacklisted as blacklisted,
              b.id as bot_id, b.name as bot_name, b.currency_name,
              b.normal_days, b.weekend_days
       FROM selected_bot sb
       JOIN bots b ON sb.name = b.name
       WHERE sb.bot_account_id = ?`,
      [botAccountId]
    );

    const currentBotIds = currentSelectedBots.map((bot) => bot.bot_id);

    // Determine bots to remove and bots to add
    const botIdsToRemove = currentBotIds.filter((id) => !botIds.includes(id));
    const botIdsToAdd = botIds.filter((id) => !currentBotIds.includes(id));

    // Track changes for response
    const changes = {
      added: botIdsToAdd.length,
      removed: botIdsToRemove.length,
      blacklist_updated: 0,
      crosstrades_deleted: false,
    };

    // Handle blacklist updates first (for existing bots)
    if (blacklistUpdates.length > 0) {
      for (const update of blacklistUpdates) {
        const botExists = currentSelectedBots.find(
          (bot) => bot.selected_bot_id === update.selectedBotId
        );

        if (botExists) {
          await pool.execute(
            `UPDATE selected_bot 
             SET blacklisted = ?, updated_at = ?
             WHERE id = ? AND bot_account_id = ?`,
            [update.blacklisted, now, update.selectedBotId, botAccountId]
          );
          changes.blacklist_updated++;
        }
      }
    }

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
          selectedBotsToRemove
        );

        // Then delete the selected_bot records
        await pool.execute(
          `DELETE FROM selected_bot WHERE id IN (${deletePlaceholders})`,
          selectedBotsToRemove
        );

        changes.crosstrades_deleted = true;
      }
    }

    let addedBots: any[] = [];
    if (botIdsToAdd.length > 0) {
      const addPlaceholders = botIdsToAdd.map(() => "?").join(",");
      const [botsToAddDetails] = await pool.execute<any[]>(
        `SELECT id, name, currency_name, normal_days, weekend_days 
         FROM bots 
         WHERE id IN (${addPlaceholders})`,
        botIdsToAdd
      );

      if (
        !Array.isArray(botsToAddDetails) ||
        botsToAddDetails.length !== botIdsToAdd.length
      ) {
        return NextResponse.json(
          { error: "One or more bots not found" },
          { status: 404 }
        );
      }

      // Create new selected_bot records (blacklisted defaults to false)
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
              blacklisted,
              last_crosstraded_at, 
              voted_at, 
              updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              selectedBotId,
              botAccountId,
              bot.name,
              bot.currency_name,
              0,
              bot.normal_days,
              bot.weekend_days,
              false,
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
            blacklisted: false,
          };
        })
      );
    }

    if (
      botIdsToRemove.length > 0 ||
      botIdsToAdd.length > 0 ||
      blacklistUpdates.length > 0
    ) {
      await pool.execute(
        "UPDATE bot_accounts SET updated_at = ? WHERE id = ?",
        [now, botAccountId]
      );
    }

    // Fetch updated list for response
    const [updatedSelectedBots] = await pool.execute<any[]>(
      `SELECT sb.id as selected_bot_id, sb.name as selected_bot_name,
              sb.blacklisted as blacklisted,
              b.id as bot_id, b.name as bot_name, b.currency_name,
              b.normal_days, b.weekend_days
       FROM selected_bot sb
       JOIN bots b ON sb.name = b.name
       WHERE sb.bot_account_id = ?`,
      [botAccountId]
    );

    const allBots = updatedSelectedBots.map((bot) => ({
      id: bot.selected_bot_id,
      bot_id: bot.bot_id,
      name: bot.bot_name,
      currency_name: bot.currency_name,
      normal_days: bot.normal_days,
      weekend_days: bot.weekend_days,
      blacklisted: bot.blacklisted,
    }));

    await invalidateUserCache(session.user.id);

    const actor: AuditActor = {
      user_id: session.user.id,
      email: session.user.email,
      name: session.user.username,
    };

    const auditDetails: any = {
      user_id: session.user.id,
    };

    if (botIdsToAdd.length > 0) {
      auditDetails.added_bot_names = addedBots.map((bot) => bot.name);
    }

    if (botIdsToRemove.length > 0) {
      auditDetails.removed_bot_names = currentSelectedBots
        .filter((bot) => botIdsToRemove.includes(bot.bot_id))
        .map((bot) => bot.bot_name);
      auditDetails.crosstrades_deleted = changes.crosstrades_deleted;
    }

    if (blacklistUpdates.length > 0) {
      auditDetails.blacklist_updates = blacklistUpdates.map((update) => ({
        selected_bot_id: update.selectedBotId,
        new_status: update.blacklisted,
      }));
    }

    // Construct message based on changes
    let message = "";
    if (
      changes.added === 0 &&
      changes.removed === 0 &&
      changes.blacklist_updated === 0
    ) {
      message = "No changes made to bot associations";
    } else {
      const parts = [];
      if (changes.added > 0) parts.push(`added ${changes.added} bot(s)`);
      if (changes.removed > 0) parts.push(`removed ${changes.removed} bot(s)`);
      if (changes.blacklist_updated > 0)
        parts.push(`updated blacklist for ${changes.blacklist_updated} bot(s)`);
      message = `Successfully ${parts.join(", ")}`;
    }

    await logAudit(
      actor,
      "user_action",
      `@${actor.name} updated bots of account (${accountExists[0].account_name} - #${botAccountId}) - ${message}`,
      auditDetails
    );

    return NextResponse.json(
      {
        success: true,
        message,
        data: {
          total_bots: allBots.length,
          changes,
          bots: allBots,
          bot_account_updated_at: now,
        },
      },
      { status: 200 }
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
