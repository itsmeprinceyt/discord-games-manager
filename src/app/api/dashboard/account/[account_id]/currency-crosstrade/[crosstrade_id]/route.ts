/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { initServer, db } from "../../../../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../auth/[...nextauth]/route";
import { getCurrentDateTime } from "../../../../../../../utils/Variables/getDateTime.util";
import { PoolConnection } from "mysql2/promise";
import { AuditActor } from "../../../../../../../types/Admin/AuditLogger/auditLogger.type";
import { logAudit } from "../../../../../../../utils/Variables/AuditLogger.util";
import { invalidateUserCache } from "../../../../../../../utils/Redis/invalidateUserRedisData";

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidISODate(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== "string") return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

export interface EditCurrencyCrossTradeRequest {
  from_selected_bot_id: string;
  from_amount: number;
  to_selected_bot_id: string;
  to_amount: number;
  crosstrade_date: string;
  traded_with?: string | null;
  trade_with_name?: string | null;
  trade_link?: string | null;
  trade_link_second?: string | null;
  note?: string | null;
}

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

    const body = (await request.json()) as EditCurrencyCrossTradeRequest;
    const {
      from_selected_bot_id,
      from_amount,
      to_selected_bot_id,
      to_amount,
      crosstrade_date,
      traded_with,
      trade_with_name,
      trade_link,
      trade_link_second,
      note,
    } = body;

    // ── Required field checks ──────────────────────────────────────────────────
    if (!from_selected_bot_id || !to_selected_bot_id) {
      return NextResponse.json(
        {
          success: false,
          error: "from_selected_bot_id and to_selected_bot_id are required",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(from_amount) || from_amount <= 0) {
      return NextResponse.json(
        { success: false, error: "from_amount must be a positive integer" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(to_amount) || to_amount <= 0) {
      return NextResponse.json(
        { success: false, error: "to_amount must be a positive integer" },
        { status: 400 }
      );
    }

    if (!crosstrade_date) {
      return NextResponse.json(
        { success: false, error: "crosstrade_date is required" },
        { status: 400 }
      );
    }

    if (!isValidISODate(crosstrade_date)) {
      return NextResponse.json(
        {
          success: false,
          error: "crosstrade_date must be a valid ISO 8601 date string",
        },
        { status: 400 }
      );
    }

    const storedCrossTradeDate = new Date(crosstrade_date).toISOString();

    // ── Optional field validations ─────────────────────────────────────────────
    if (traded_with !== undefined && traded_with !== null) {
      if (typeof traded_with !== "string" || traded_with.trim().length > 36) {
        return NextResponse.json(
          {
            success: false,
            error: "traded_with must be a string of max 36 characters",
          },
          { status: 400 }
        );
      }
    }

    if (trade_with_name !== undefined && trade_with_name !== null) {
      if (
        typeof trade_with_name !== "string" ||
        trade_with_name.trim().length > 50
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "trade_with_name must be a string of max 50 characters",
          },
          { status: 400 }
        );
      }
    }

    if (
      trade_link !== undefined &&
      trade_link !== null &&
      trade_link.trim() !== ""
    ) {
      if (!isValidUrl(trade_link.trim())) {
        return NextResponse.json(
          {
            success: false,
            error: "trade_link must be a valid HTTP/HTTPS URL",
          },
          { status: 400 }
        );
      }
      if (trade_link.trim().length > 100) {
        return NextResponse.json(
          {
            success: false,
            error: "trade_link must be at most 100 characters",
          },
          { status: 400 }
        );
      }
    }

    if (
      trade_link_second !== undefined &&
      trade_link_second !== null &&
      trade_link_second.trim() !== ""
    ) {
      if (!isValidUrl(trade_link_second.trim())) {
        return NextResponse.json(
          {
            success: false,
            error: "trade_link_second must be a valid HTTP/HTTPS URL",
          },
          { status: 400 }
        );
      }
      if (trade_link_second.trim().length > 100) {
        return NextResponse.json(
          {
            success: false,
            error: "trade_link_second must be at most 100 characters",
          },
          { status: 400 }
        );
      }
    }

    if (note !== undefined && note !== null) {
      if (typeof note !== "string" || note.trim().length > 250) {
        return NextResponse.json(
          {
            success: false,
            error: "note must be a string of max 250 characters",
          },
          { status: 400 }
        );
      }
    }

    await initServer();
    const pool = db();

    // ── Fetch the existing trade and verify ownership ──────────────────────────
    const [existingRows] = await pool.execute<any[]>(
      `SELECT cct.*
       FROM currency_crosstrades cct
       WHERE cct.id = ? AND cct.user_id = ?
         AND (cct.from_bot_account_id = ? OR cct.to_bot_account_id = ?)`,
      [crosstrade_id, session.user.id, account_id, account_id]
    );

    if (!Array.isArray(existingRows) || existingRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Trade not found or access denied" },
        { status: 404 }
      );
    }

    const existing = existingRows[0];

    // ── Validate from bot belongs to the same from_bot_account and check blacklist ──
    const [fromBotCheck] = await pool.execute<any[]>(
      `SELECT id, currency_name, blacklisted FROM selected_bot WHERE id = ? AND bot_account_id = ?`,
      [from_selected_bot_id, existing.from_bot_account_id]
    );

    if (!Array.isArray(fromBotCheck) || fromBotCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: "From bot not found in the original account" },
        { status: 404 }
      );
    }

    // Check if from bot is blacklisted
    if (
      fromBotCheck[0].blacklisted === true ||
      fromBotCheck[0].blacklisted === 1
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot update crosstrade: The source bot is blacklisted",
          details: `Bot "${fromBotCheck[0].currency_name}" has been blacklisted and cannot be used in trades`,
        },
        { status: 403 }
      );
    }

    // ── Validate to bot belongs to the same to_bot_account and check blacklist ──
    const [toBotCheck] = await pool.execute<any[]>(
      `SELECT id, currency_name, blacklisted FROM selected_bot WHERE id = ? AND bot_account_id = ?`,
      [to_selected_bot_id, existing.to_bot_account_id]
    );

    if (!Array.isArray(toBotCheck) || toBotCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: "To bot not found in the original account" },
        { status: 404 }
      );
    }

    // Check if to bot is blacklisted
    if (toBotCheck[0].blacklisted === true || toBotCheck[0].blacklisted === 1) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot update crosstrade: The destination bot is blacklisted",
          details: `Bot "${toBotCheck[0].currency_name}" has been blacklisted and cannot be used in trades`,
        },
        { status: 403 }
      );
    }

    if (
      existing.from_bot_account_id === existing.to_bot_account_id &&
      from_selected_bot_id === to_selected_bot_id
    ) {
      return NextResponse.json(
        { success: false, error: "Cannot crosstrade a bot with itself" },
        { status: 400 }
      );
    }

    const now = getCurrentDateTime();
    connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // ── Update the trade record only (no balance changes on edit) ─────────
      await connection.execute(
        `UPDATE currency_crosstrades SET
          from_selected_bot_id = ?,
          from_currency_name = ?,
          from_amount = ?,
          to_selected_bot_id = ?,
          to_currency_name = ?,
          to_amount = ?,
          crosstrade_date = ?,
          traded_with = ?,
          trade_with_name = ?,
          trade_link = ?,
          trade_link_second = ?,
          note = ?,
          updated_at = ?
         WHERE id = ? AND user_id = ?`,
        [
          from_selected_bot_id,
          fromBotCheck[0].currency_name,
          from_amount,
          to_selected_bot_id,
          toBotCheck[0].currency_name,
          to_amount,
          storedCrossTradeDate,
          traded_with?.trim() || null,
          trade_with_name?.trim() || null,
          trade_link?.trim() || null,
          trade_link_second?.trim() || null,
          note?.trim() || null,
          now,
          crosstrade_id,
          session.user.id,
        ]
      );

      // ── Sync last_currency_crosstraded_at for both bots ───────────────────
      // Fetch the latest crosstrade_date for each bot across ALL their trades
      // (as either giver or receiver) and update accordingly
      await connection.execute(
        `UPDATE selected_bot
         SET last_currency_crosstraded_at = (
           SELECT MAX(crosstrade_date)
           FROM currency_crosstrades
           WHERE from_selected_bot_id = ? OR to_selected_bot_id = ?
         ),
         updated_at = ?
         WHERE id = ?`,
        [from_selected_bot_id, from_selected_bot_id, now, from_selected_bot_id]
      );

      if (from_selected_bot_id !== to_selected_bot_id) {
        await connection.execute(
          `UPDATE selected_bot
           SET last_currency_crosstraded_at = (
             SELECT MAX(crosstrade_date)
             FROM currency_crosstrades
             WHERE from_selected_bot_id = ? OR to_selected_bot_id = ?
           ),
           updated_at = ?
           WHERE id = ?`,
          [to_selected_bot_id, to_selected_bot_id, now, to_selected_bot_id]
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
        `@${actor.name} updated currency crosstrade #${crosstrade_id}`,
        {
          crosstrade_id,
          from_amount,
          from_currency: fromBotCheck[0].currency_name,
          to_amount,
          to_currency: toBotCheck[0].currency_name,
          crosstrade_date: storedCrossTradeDate,
        }
      );

      return NextResponse.json(
        { success: true, message: "Currency crosstrade updated successfully" },
        { status: 200 }
      );
    } catch (dbError) {
      if (connection) await connection.rollback();
      throw dbError;
    }
  } catch (error: unknown) {
    console.error("Currency crosstrade edit error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (e) {
        console.error(e);
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
          error: "Currency crosstrade ID is required",
        },
        { status: 400 }
      );
    }

    await initServer();
    const pool = db();

    // Validation 3: Check if the trade exists and belongs to the user
    // Note: A currency crosstrade can belong to either from_bot_account_id or to_bot_account_id
    const [existingTrade] = await pool.execute<any[]>(
      `
      SELECT 
        cct.id,
        cct.user_id,
        cct.from_bot_account_id,
        cct.to_bot_account_id,
        cct.from_selected_bot_id,
        cct.to_selected_bot_id,
        cct.from_amount,
        cct.to_amount,
        cct.from_currency_name,
        cct.to_currency_name,
        cct.crosstrade_date,
        fb.name as from_bot_name,
        tb.name as to_bot_name,
        fba.name as from_account_name,
        tba.name as to_account_name
      FROM currency_crosstrades cct
      LEFT JOIN selected_bot fb ON cct.from_selected_bot_id = fb.id
      LEFT JOIN selected_bot tb ON cct.to_selected_bot_id = tb.id
      LEFT JOIN bot_accounts fba ON cct.from_bot_account_id = fba.id
      LEFT JOIN bot_accounts tba ON cct.to_bot_account_id = tba.id
      WHERE cct.id = ? AND cct.user_id = ? 
        AND (cct.from_bot_account_id = ? OR cct.to_bot_account_id = ?)
      `,
      [tradeId, session.user.id, accountId, accountId]
    );

    if (!Array.isArray(existingTrade) || existingTrade.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Currency crosstrade not found or you don't have permission to delete it",
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
            error:
              "Cannot delete currency crosstrades older than 30 days. Contact admin",
          },
          { status: 403 }
        );
      }

      // Delete the currency crosstrade
      const [deleteResult] = await connection.execute(
        `
        DELETE FROM currency_crosstrades 
        WHERE id = ? AND user_id = ?
        `,
        [tradeId, session.user.id]
      );

      // Check if delete was successful
      const result = deleteResult as any;
      if (result.affectedRows === 0) {
        throw new Error("Failed to delete currency crosstrade");
      }

      // Update last_currency_crosstraded_at for both bots involved
      // For the FROM bot
      if (tradeData.from_selected_bot_id) {
        // Find the next latest crosstrade date for this bot (as either giver or receiver)
        const [latestFromCrosstrade] = await connection.execute<any[]>(
          `
          SELECT MAX(crosstrade_date) as latest_date 
          FROM currency_crosstrades 
          WHERE (from_selected_bot_id = ? OR to_selected_bot_id = ?) 
            AND id != ?
          `,
          [
            tradeData.from_selected_bot_id,
            tradeData.from_selected_bot_id,
            tradeId,
          ]
        );

        const latestFromDate =
          Array.isArray(latestFromCrosstrade) &&
          latestFromCrosstrade.length > 0 &&
          latestFromCrosstrade[0].latest_date
            ? latestFromCrosstrade[0].latest_date
            : null;

        // Update the FROM bot with the new latest date (or NULL if no trades left)
        await connection.execute(
          `
          UPDATE selected_bot 
          SET last_currency_crosstraded_at = ?,
              updated_at = ?
          WHERE id = ?
          `,
          [latestFromDate, now, tradeData.from_selected_bot_id]
        );
      }

      // For the TO bot (if different from FROM bot)
      if (
        tradeData.to_selected_bot_id &&
        tradeData.to_selected_bot_id !== tradeData.from_selected_bot_id
      ) {
        // Find the next latest crosstrade date for this bot (as either giver or receiver)
        const [latestToCrosstrade] = await connection.execute<any[]>(
          `
          SELECT MAX(crosstrade_date) as latest_date 
          FROM currency_crosstrades 
          WHERE (from_selected_bot_id = ? OR to_selected_bot_id = ?) 
            AND id != ?
          `,
          [tradeData.to_selected_bot_id, tradeData.to_selected_bot_id, tradeId]
        );

        const latestToDate =
          Array.isArray(latestToCrosstrade) &&
          latestToCrosstrade.length > 0 &&
          latestToCrosstrade[0].latest_date
            ? latestToCrosstrade[0].latest_date
            : null;

        // Update the TO bot with the new latest date (or NULL if no trades left)
        await connection.execute(
          `
          UPDATE selected_bot 
          SET last_currency_crosstraded_at = ?,
              updated_at = ?
          WHERE id = ?
          `,
          [latestToDate, now, tradeData.to_selected_bot_id]
        );
      }

      await connection.commit();

      // Invalidate user cache to reflect changes
      await invalidateUserCache(session.user.id);

      return NextResponse.json(
        {
          success: true,
          message: "Currency crosstrade deleted successfully",
          data: {
            id: tradeId,
            deleted_at: now,
          },
        },
        { status: 200 }
      );
    } catch (dbError: unknown) {
      if (connection) {
        await connection.rollback();
      }
      console.error(
        "Database error during currency crosstrade deletion:",
        dbError
      );
      throw dbError;
    }
  } catch (error: unknown) {
    console.error("Error deleting currency crosstrade:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete currency crosstrade",
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
