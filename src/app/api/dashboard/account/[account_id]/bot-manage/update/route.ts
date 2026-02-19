// eslint-disable @typescript-eslint/no-explicit-any
import { NextRequest, NextResponse } from "next/server";
// import { initServer, db } from "../../../../../../../lib/initServer";
// import { getCurrentDateTime } from "../../../../../../../utils/Variables/getDateTime.util";
// import { generateHexId } from "../../../../../../../utils/Variables/generateHexID.util";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../auth/[...nextauth]/route";
// import { AuditActor } from "../../../../../../../types/Admin/AuditLogger/auditLogger.type";
// import { logAudit } from "../../../../../../../utils/Variables/AuditLogger.util";

// TODO: put this in a file
interface RequestBody {
  botIds: string[];
  botAccountId: string;
}

/**
 * Updates the selected bots association for a bot account.
 *
 * This endpoint allows users to manage which bots are associated with their bot account.
 * It handles adding new bot associations and removing old ones, while also managing
 * the cleanup of related crosstrades data.
 *
 * Workflow:
 * 1. Authenticate the user session
 * 2. Validate the input parameters (botAccountId and botIds array)
 * 3. Check if the specified bot account exists and belongs to the authenticated user
 * 4. Fetch the currently selected bots for the account
 * 5. For each currently selected bot, determine if it's being removed (not in the new botIds list)
 * 6. If bots are being removed, delete their associated crosstrades from the crosstrades table
 * 7. Delete all current selected_bot entries for the account
 * 8. If botIds array is empty:
 *    - Log audit trail for complete removal
 *    - Return success response indicating all bots and crosstrades were removed
 * 9. If botIds array has entries:
 *    - Validate that all specified bot IDs exist in the database
 *    - Create new selected_bot entries for each bot ID
 *    - Log audit trail with details of the update
 *    - Return success response with the new bot associations
 *
 * Note: When botIds is an empty array, this indicates the user wants to remove
 * all bot associations and their related crosstrades from the account.
 */
export async function POST(request: NextRequest) {
  //try {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized - Please log in" },
      { status: 401 },
    );
  }
  const body: RequestBody = await request.json();
  console.log(body);
  if (true) {
    return NextResponse.json(
      {
        error:
          "This action is currently disabled until its fixed. Thank you for understanding.",
      },
      { status: 401 },
    );
  }
  // }
}
/*
    
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

    const [currentSelectedBots] = await pool.execute<any[]>(
      "SELECT id, name FROM selected_bot WHERE bot_account_id = ?",
      [botAccountId]
    );

    let crosstradesDeleted = false;

    if (Array.isArray(currentSelectedBots) && currentSelectedBots.length > 0) {
      const [currentBotDetails] = await pool.execute<any[]>(
        `SELECT sb.id as selected_bot_id, b.id as bot_id, b.name as bot_name
         FROM selected_bot sb
         JOIN bots b ON sb.name = b.name
         WHERE sb.bot_account_id = ?`,
        [botAccountId]
      );

      if (botIds.length > 0 && Array.isArray(currentBotDetails)) {
        const placeholders = botIds.map(() => "?").join(",");
        const [botsToKeep] = await pool.execute<any[]>(
          `SELECT id, name FROM bots WHERE id IN (${placeholders})`,
          botIds
        );

        if (Array.isArray(botsToKeep)) {
          const botsToKeepIds = botsToKeep.map((bot) => bot.id);
          const selectedBotsToDelete = currentBotDetails.filter(
            (botDetail) => !botsToKeepIds.includes(botDetail.bot_id)
          );

          if (selectedBotsToDelete.length > 0) {
            const selectedBotIdsToDelete = selectedBotsToDelete.map(
              (bot) => bot.selected_bot_id
            );
            const deletePlaceholders = selectedBotIdsToDelete
              .map(() => "?")
              .join(",");

            await pool.execute(
              `DELETE FROM crosstrades WHERE selected_bot_id IN (${deletePlaceholders})`,
              selectedBotIdsToDelete
            );
            crosstradesDeleted = true;
          }
        }
      } else if (botIds.length === 0 && Array.isArray(currentBotDetails)) {
        const selectedBotIds = currentBotDetails.map(
          (bot) => bot.selected_bot_id
        );
        if (selectedBotIds.length > 0) {
          const deletePlaceholders = selectedBotIds.map(() => "?").join(",");

          await pool.execute(
            `DELETE FROM crosstrades WHERE selected_bot_id IN (${deletePlaceholders})`,
            selectedBotIds
          );
          crosstradesDeleted = true;
        }
      }
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
        `User removed all bots and their crosstrades from account #${botAccountId}`,
        {
          user_id: session.user.id,
          removed_all_bots: true,
          crosstrades_deleted: crosstradesDeleted,
        }
      );

      return NextResponse.json(
        {
          success: true,
          message: "All bots and their crosstrades removed from account",
          data: {
            removedAll: true,
            count: 0,
            crosstrades_deleted: crosstradesDeleted,
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
        crosstrades_deleted: crosstradesDeleted,
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: `Updated bots association with this account (${insertedBots.length} bots)`,
        data: {
          count: insertedBots.length,
          bots: insertedBots,
          crosstrades_deleted: crosstradesDeleted,
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
*/
