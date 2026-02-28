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
import { getRedis } from "../../../../../../lib/Redis/redis";
import { SINGLE_USER_CROSSTRADES_TTL } from "../../../../../../utils/Redis/redisTTL";
import getCurrencyCrosstradeLogsRedisKey from "../../../../../../utils/Redis/getCurrencyCrosstradeLogsRedisKey";

export interface CurrencyCrossTrade {
  id: string;
  user_id: string;
  from_bot_account_id: string;
  from_bot_account_name: string;
  from_selected_bot_id: string;
  from_bot_name: string;
  from_currency_name: string;
  from_amount: number;
  to_bot_account_id: string;
  to_bot_account_name: string;
  to_selected_bot_id: string;
  to_bot_name: string;
  to_currency_name: string;
  to_amount: number;
  traded_with: string | null;
  trade_link: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

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

export async function GET(
  request: Request,
  context: { params: Promise<{ account_id: string }> }
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

    await initServer();
    const redis = getRedis();

    // Cache key scoped to both user AND account so different accounts don't share cache
    const cacheKey = `${getCurrencyCrosstradeLogsRedisKey()}:${
      session.user.id
    }:${accountId}`;

    const cached = await redis.get<CurrencyCrossTrade[]>(cacheKey);
    if (cached) {
      return NextResponse.json(
        { success: true, data: cached },
        { status: 200 }
      );
    }

    const pool = db();

    // Verify the account belongs to the user before returning any data
    const [accountCheck] = await pool.execute<any[]>(
      `SELECT id FROM bot_accounts WHERE id = ? AND user_id = ?`,
      [accountId, session.user.id]
    );

    if (!Array.isArray(accountCheck) || accountCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: "Account not found or access denied" },
        { status: 403 }
      );
    }

    const [rows] = await pool.execute<any[]>(
      `SELECT
        cct.id,
        cct.user_id,
        cct.from_bot_account_id,
        from_ba.name AS from_bot_account_name,
        cct.from_selected_bot_id,
        from_sb.name AS from_bot_name,
        cct.from_currency_name,
        cct.from_amount,
        cct.to_bot_account_id,
        to_ba.name AS to_bot_account_name,
        cct.to_selected_bot_id,
        to_sb.name AS to_bot_name,
        cct.to_currency_name,
        cct.to_amount,
        cct.traded_with,
        cct.trade_link,
        cct.note,
        cct.created_at,
        cct.updated_at
       FROM currency_crosstrades cct
       JOIN bot_accounts from_ba ON cct.from_bot_account_id = from_ba.id
       JOIN selected_bot from_sb ON cct.from_selected_bot_id = from_sb.id
       JOIN bot_accounts to_ba ON cct.to_bot_account_id = to_ba.id
       JOIN selected_bot to_sb ON cct.to_selected_bot_id = to_sb.id
       WHERE cct.user_id = ?
         AND (cct.from_bot_account_id = ? OR cct.to_bot_account_id = ?)
       ORDER BY cct.created_at DESC`,
      [session.user.id, accountId, accountId]
    );

    const data: CurrencyCrossTrade[] = Array.isArray(rows)
      ? rows.map((row) => ({
          id: row.id,
          user_id: row.user_id,
          from_bot_account_id: row.from_bot_account_id,
          from_bot_account_name: row.from_bot_account_name,
          from_selected_bot_id: row.from_selected_bot_id,
          from_bot_name: row.from_bot_name,
          from_currency_name: row.from_currency_name,
          from_amount: Number(row.from_amount),
          to_bot_account_id: row.to_bot_account_id,
          to_bot_account_name: row.to_bot_account_name,
          to_selected_bot_id: row.to_selected_bot_id,
          to_bot_name: row.to_bot_name,
          to_currency_name: row.to_currency_name,
          to_amount: Number(row.to_amount),
          traded_with: row.traded_with,
          trade_link: row.trade_link,
          note: row.note,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }))
      : [];

    await redis.set(cacheKey, data, {
      ex: SINGLE_USER_CROSSTRADES_TTL,
    });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching currency crosstrades:", error);
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

    if (
      from_bot_account_id === to_bot_account_id &&
      from_selected_bot_id === to_selected_bot_id
    ) {
      return NextResponse.json(
        { success: false, error: "Cannot crosstrade a bot with itself" },
        { status: 400 }
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
        `UPDATE selected_bot SET balance = GREATEST(balance - ?, 0), last_currency_crosstraded_at = ?, updated_at = ?
         WHERE id = ? AND bot_account_id = ? AND balance >= ?`,
        [
          from_amount,
          now,
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
        `UPDATE selected_bot SET balance = balance + ?, last_currency_crosstraded_at = ?, updated_at = ? WHERE id = ? AND bot_account_id = ?`,
        [to_amount, now, now, to_selected_bot_id, to_bot_account_id]
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
        "crosstrade_entry",
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
