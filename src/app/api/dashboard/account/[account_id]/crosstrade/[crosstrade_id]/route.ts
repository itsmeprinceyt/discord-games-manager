/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { initServer, db } from "../../../../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../auth/[...nextauth]/route";
import { getCurrentDateTime } from "../../../../../../../utils/Variables/getDateTime.util";
import { PoolConnection } from "mysql2/promise";
import { AuditActor } from "../../../../../../../types/Admin/AuditLogger/auditLogger.type";
import { logAudit } from "../../../../../../../utils/Variables/AuditLogger.util";
import { CrossTradeRequestAPI } from "../route";
import { invalidateUserCache } from "../../../../../../../utils/Redis/invalidateUserRedisData";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ account_id: string; crosstrade_id: string }> }
) {
  let connection: PoolConnection | null = null;

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const { account_id, crosstrade_id } = await context.params;
    const accountId = account_id;
    const tradeId = crosstrade_id;

    const body = await request.json();
    const {
      crosstrade_date,
      currency,
      crosstrade_via,
      amount_received,
      rate,
      conversion_rate,
      net_amount,
      traded_with,
      trade_with_name,
      trade_link,
      traded,
      paid,
      note,
      bot_id,
    } = body as CrossTradeRequestAPI;

    const requiredFields = [
      "crosstrade_date",
      "currency",
      "crosstrade_via",
      "amount_received",
    ];

    for (const field of requiredFields) {
      if (!body[field as keyof CrossTradeRequestAPI]) {
        console.error(`Missing required field: ${field}`);
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    await initServer();
    const pool = db();

    const [existingTrade] = await pool.execute<any[]>(
      `
      SELECT 
        ct.id,
        ct.user_id,
        ct.bot_account_id,
        ct.selected_bot_id
      FROM crosstrades ct
      WHERE ct.id = ? AND ct.user_id = ? AND ct.bot_account_id = ?
    `,
      [tradeId, session.user.id, accountId]
    );

    if (!Array.isArray(existingTrade) || existingTrade.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cross trade not found or you don't have permission to edit it",
        },
        { status: 404 }
      );
    }

    const existingTradeData = existingTrade[0];

    let selectedBotId = existingTradeData.selected_bot_id;
    if (bot_id && bot_id !== selectedBotId) {
      const [botValidation] = await pool.execute<any[]>(
        `
        SELECT id FROM selected_bot 
        WHERE id = ? AND bot_account_id = ?
      `,
        [bot_id, accountId]
      );

      if (!Array.isArray(botValidation) || botValidation.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Bot not found or does not belong to the specified account",
          },
          { status: 404 }
        );
      }
      selectedBotId = bot_id;
    }

    const dateObj = new Date(crosstrade_date);
    if (isNaN(dateObj.getTime())) {
      console.error("Invalid date format:", crosstrade_date);
      return NextResponse.json(
        { success: false, error: "Invalid date format" },
        { status: 400 }
      );
    }

    if (typeof amount_received !== "number" || amount_received <= 0) {
      console.error("Invalid amount_received:", amount_received);
      return NextResponse.json(
        { success: false, error: "Amount received must be a positive number" },
        { status: 400 }
      );
    }

    if (
      net_amount !== null &&
      (typeof net_amount !== "number" || net_amount <= 0)
    ) {
      console.error("Invalid net_amount:", net_amount);
      return NextResponse.json(
        {
          success: false,
          error: "Net amount must be a positive number or null",
        },
        { status: 400 }
      );
    }

    if (
      currency === "usd" &&
      (!conversion_rate ||
        typeof Number(conversion_rate) !== "number" ||
        Number(conversion_rate) <= 0)
    ) {
      console.error("Invalid conversion_rate for USD:", conversion_rate);
      return NextResponse.json(
        {
          success: false,
          error: "Conversion rate is required and must be positive for USD",
        },
        { status: 400 }
      );
    }

    if (rate && rate.length > 10) {
      console.error("Rate too long:", rate.length);
      return NextResponse.json(
        { success: false, error: "Rate must be 10 characters or less" },
        { status: 400 }
      );
    }

    if (traded_with && traded_with.length > 36) {
      console.error("Traded_with too long:", traded_with.length);
      return NextResponse.json(
        { success: false, error: "Trader ID must be 36 characters or less" },
        { status: 400 }
      );
    }

    if (trade_with_name && trade_with_name.length > 50) {
      return NextResponse.json(
        {
          success: false,
          error: "Trade with name must be 50 characters or less",
        },
        { status: 400 }
      );
    }

    if (trade_link && trade_link.length > 100) {
      console.error("Trade link too long:", trade_link.length);
      return NextResponse.json(
        { success: false, error: "Trade link must be 100 characters or less" },
        { status: 400 }
      );
    }

    if (note && note.length > 250) {
      console.error("Note too long:", note.length);
      return NextResponse.json(
        { success: false, error: "Note must be 250 characters or less" },
        { status: 400 }
      );
    }

    const now = getCurrentDateTime();
    connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const updateCrosstradeQuery = `
        UPDATE crosstrades 
        SET 
          selected_bot_id = ?,
          crosstrade_date = ?,
          currency = ?,
          crosstrade_via = ?,
          amount_received = ?,
          rate = ?,
          conversion_rate = ?,
          net_amount = ?,
          traded_with = ?,
          trade_with_name = ?,
          trade_link = ?,
          traded = ?,
          paid = ?,
          note = ?,
          updated_at = ?
        WHERE id = ? AND user_id = ? AND bot_account_id = ?
      `;

      await connection.execute(updateCrosstradeQuery, [
        selectedBotId,
        crosstrade_date,
        currency,
        crosstrade_via,
        amount_received,
        rate,
        Number(conversion_rate),
        net_amount,
        traded_with,
        trade_with_name,
        trade_link,
        traded,
        paid,
        note,
        now,
        tradeId,
        session.user.id,
        accountId,
      ]);

      // 1. First, update the new selected_bot (if bot was changed)
      if (selectedBotId) {
        await connection.execute(
          `
          UPDATE selected_bot 
          SET last_crosstraded_at = (
            SELECT MAX(crosstrade_date) 
            FROM crosstrades 
            WHERE selected_bot_id = ?
          ),
          updated_at = ?
          WHERE id = ? AND bot_account_id = ?
        `,
          [selectedBotId, now, selectedBotId, accountId]
        );
      }

      // 2. If the bot was changed from a previous bot, also update the old bot
      if (bot_id && bot_id !== existingTradeData.selected_bot_id) {
        const oldSelectedBotId = existingTradeData.selected_bot_id;

        // Update old bot's last_crosstraded_at to its latest trade date (or NULL if no trades)
        await connection.execute(
          `
          UPDATE selected_bot 
          SET last_crosstraded_at = (
            SELECT MAX(crosstrade_date) 
            FROM crosstrades 
            WHERE selected_bot_id = ?
          ),
          updated_at = ?
          WHERE id = ? AND bot_account_id = ?
        `,
          [oldSelectedBotId, now, oldSelectedBotId, accountId]
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
        "crosstrade_update",
        `@${actor.name} updated crosstrade #${tradeId}`,
        {
          user_id: session.user.id,
          crosstrade_id: tradeId,
          account_id: accountId,
          bot_id: selectedBotId,
        }
      );

      return NextResponse.json(
        {
          success: true,
          message: "Cross trade updated successfully",
          data: {
            id: tradeId,
            updated_at: now,
          },
        },
        { status: 200 }
      );
    } catch (dbError: unknown) {
      if (connection) {
        await connection.rollback();
      }
      console.error("Database error during update:", dbError);
      throw dbError;
    }
  } catch (error: unknown) {
    console.error("Error updating cross trade:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update cross trade",
        message: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error("Error releasing connection:", releaseError);
      }
    }
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ account_id: string; crosstrade_id: string }> }
) {
  let connection: PoolConnection | null = null;

  try {
    const session = await getServerSession(authOptions);

    // Validation 1: Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Please log in",
        },
        { status: 401 }
      );
    }

    const { account_id, crosstrade_id } = await context.params;
    const accountId = account_id;
    const tradeId = crosstrade_id;

    // Validation 2: Check if trade ID is provided
    if (!tradeId) {
      return NextResponse.json(
        {
          success: false,
          error: "Cross trade ID is required",
        },
        { status: 400 }
      );
    }

    await initServer();
    const pool = db();

    // Validation 3: Check if the trade exists and belongs to the user
    const [existingTrade] = await pool.execute<any[]>(
      `
      SELECT 
        ct.id,
        ct.user_id,
        ct.bot_account_id,
        ct.selected_bot_id,
        ct.amount_received,
        ct.currency,
        ct.crosstrade_date,
        sb.name as bot_name,
        ba.name as account_name
      FROM crosstrades ct
      LEFT JOIN selected_bot sb ON ct.selected_bot_id = sb.id
      LEFT JOIN bot_accounts ba ON ct.bot_account_id = ba.id
      WHERE ct.id = ? AND ct.user_id = ? AND ct.bot_account_id = ?
      `,
      [tradeId, session.user.id, accountId]
    );

    if (!Array.isArray(existingTrade) || existingTrade.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cross trade not found or you don't have permission to delete it",
        },
        { status: 404 }
      );
    }

    const tradeData = existingTrade[0];
    const now = getCurrentDateTime();
    connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Validation 4: Optional - Check if trade is recent enough to delete
      // You can adjust this based on your business rules
      const tradeDate = new Date(tradeData.crosstrade_date);
      const currentDate = new Date();
      const daysDifference = Math.floor(
        (currentDate.getTime() - tradeDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Optional: Prevent deletion of trades older than 30 days
      // Comment this out if you don't want this restriction
      if (daysDifference > 30) {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot delete trades older than 30 days. Contact admin",
          },
          { status: 403 }
        );
      }

      // Delete the cross trade
      const [deleteResult] = await connection.execute(
        `
        DELETE FROM crosstrades 
        WHERE id = ? AND user_id = ? AND bot_account_id = ?
        `,
        [tradeId, session.user.id, accountId]
      );

      // Check if delete was successful
      const result = deleteResult as any;
      if (result.affectedRows === 0) {
        throw new Error("Failed to delete cross trade");
      }

      // Update the bot's last_crosstraded_at to the next latest trade
      if (tradeData.selected_bot_id) {
        // Find the next latest crosstrade date for this bot
        const [latestCrosstrade] = await connection.execute<any[]>(
          `
          SELECT MAX(crosstrade_date) as latest_date 
          FROM crosstrades 
          WHERE selected_bot_id = ? AND bot_account_id = ? AND id != ?
          `,
          [tradeData.selected_bot_id, accountId, tradeId]
        );

        const latestDate =
          Array.isArray(latestCrosstrade) &&
          latestCrosstrade.length > 0 &&
          latestCrosstrade[0].latest_date
            ? latestCrosstrade[0].latest_date
            : null;

        // Update the bot with the new latest date (or NULL if no trades left)
        await connection.execute(
          `
          UPDATE selected_bot 
          SET last_crosstraded_at = ?,
              updated_at = ?
          WHERE id = ? AND bot_account_id = ?
          `,
          [latestDate, now, tradeData.selected_bot_id, accountId]
        );
      }

      await connection.commit();

      await invalidateUserCache(session.user.id);

      return NextResponse.json(
        {
          success: true,
          message: "Cross trade deleted successfully",
        },
        { status: 200 }
      );
    } catch (dbError: unknown) {
      if (connection) {
        await connection.rollback();
      }
      console.error("Database error during deletion:", dbError);
      throw dbError;
    }
  } catch (error: unknown) {
    console.error("Error deleting cross trade:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete cross trade",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error("Error releasing connection:", releaseError);
      }
    }
  }
}
