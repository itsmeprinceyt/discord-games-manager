/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { initServer, db } from "../../../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { generateHexId } from "../../../../../../utils/Variables/generateHexID.util";
import { getCurrentDateTime } from "../../../../../../utils/Variables/getDateTime.util";
import { PoolConnection } from "mysql2/promise";
import { AuditActor } from "../../../../../../types/Admin/AuditLogger/auditLogger.type";
import { logAudit } from "../../../../../../utils/Variables/AuditLogger.util";
import { invalidateUserCache } from "../../../../../../utils/Redis/invalidateUserRedisData";

export interface CurrencyCrossTradeRequest {
  from_bot_account_id: string;
  from_selected_bot_id: string;
  from_amount: number;
  to_bot_account_id: string;
  to_selected_bot_id: string;
  to_amount: number;
  traded_with?: string | null;
  trade_link?: string | null;
  note?: string | null;
}

export async function POST(request: NextRequest) {
  let connection: PoolConnection | null = null;

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as CurrencyCrossTradeRequest;
    const {
      from_bot_account_id,
      from_selected_bot_id,
      from_amount,
      to_bot_account_id,
      to_selected_bot_id,
      to_amount,
      traded_with,
      trade_link,
      note,
    } = body;

    if (
      !from_bot_account_id ||
      !from_selected_bot_id ||
      !from_amount ||
      !to_bot_account_id ||
      !to_selected_bot_id ||
      !to_amount
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(from_amount) || from_amount <= 0) {
      return NextResponse.json(
        { success: false, error: "From amount must be a positive integer" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(to_amount) || to_amount <= 0) {
      return NextResponse.json(
        { success: false, error: "To amount must be a positive integer" },
        { status: 400 }
      );
    }

    await initServer();
    const pool = db();

    // Verify from account belongs to user
    const [fromAccountCheck] = await pool.execute<any[]>(
      `SELECT id, name FROM bot_accounts WHERE id = ? AND user_id = ?`,
      [from_bot_account_id, session.user.id]
    );

    if (!Array.isArray(fromAccountCheck) || fromAccountCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: "From account not found or access denied" },
        { status: 403 }
      );
    }

    // Verify to account belongs to user
    const [toAccountCheck] = await pool.execute<any[]>(
      `SELECT id, name FROM bot_accounts WHERE id = ? AND user_id = ?`,
      [to_bot_account_id, session.user.id]
    );

    if (!Array.isArray(toAccountCheck) || toAccountCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: "To account not found or access denied" },
        { status: 403 }
      );
    }

    // Validate from bot and check balance
    const [fromBotCheck] = await pool.execute<any[]>(
      `SELECT id, balance, currency_name FROM selected_bot WHERE id = ? AND bot_account_id = ?`,
      [from_selected_bot_id, from_bot_account_id]
    );

    if (!Array.isArray(fromBotCheck) || fromBotCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: "From bot not found" },
        { status: 404 }
      );
    }

    const fromBalance = fromBotCheck[0].balance || 0;
    if (fromBalance < from_amount) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient balance. Available: ${fromBalance} ${fromBotCheck[0].currency_name}, Requested: ${from_amount}`,
        },
        { status: 400 }
      );
    }

    const [toBotCheck] = await pool.execute<any[]>(
      `SELECT id, balance, currency_name FROM selected_bot WHERE id = ? AND bot_account_id = ?`,
      [to_selected_bot_id, to_bot_account_id]
    );

    if (!Array.isArray(toBotCheck) || toBotCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: "To bot not found" },
        { status: 404 }
      );
    }

    const now = getCurrentDateTime();
    const tradeId = generateHexId(12);

    connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      await connection.execute(
        `INSERT INTO currency_crosstrades (
          id, user_id,
          from_bot_account_id, from_selected_bot_id, from_currency_name, from_amount,
          to_bot_account_id, to_selected_bot_id, to_currency_name, to_amount,
          traded_with, trade_link, note, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tradeId,
          session.user.id,
          from_bot_account_id,
          from_selected_bot_id,
          fromBotCheck[0].currency_name,
          from_amount,
          to_bot_account_id,
          to_selected_bot_id,
          toBotCheck[0].currency_name,
          to_amount,
          traded_with || null,
          trade_link || null,
          note || null,
          now,
          now,
        ]
      );

      // Deduct from giving bot
      const [deductResult] = await connection.execute(
        `UPDATE selected_bot SET balance = GREATEST(balance - ?, 0), updated_at = ?
         WHERE id = ? AND bot_account_id = ? AND balance >= ?`,
        [
          from_amount,
          now,
          from_selected_bot_id,
          from_bot_account_id,
          from_amount,
        ]
      );

      if ((deductResult as any).affectedRows === 0) {
        throw new Error(
          "Failed to deduct balance from giving bot. Insufficient funds."
        );
      }

      await connection.execute(
        `UPDATE selected_bot SET balance = balance + ?, updated_at = ?
         WHERE id = ? AND bot_account_id = ?`,
        [to_amount, now, to_selected_bot_id, to_bot_account_id]
      );

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
        `@${actor.name} insert a new currency crosstrade`,
        {
          trade_id: tradeId,
          from_amount,
          from_currency: fromBotCheck[0].currency_name,
          to_amount,
          to_currency: toBotCheck[0].currency_name,
        }
      );

      return NextResponse.json(
        {
          success: true,
          message: "Currency crosstrade completed successfully",
        },
        { status: 201 }
      );
    } catch (dbError) {
      if (connection) await connection.rollback();
      throw dbError;
    }
  } catch (error: unknown) {
    console.error("Currency crosstrade error:", error);
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
