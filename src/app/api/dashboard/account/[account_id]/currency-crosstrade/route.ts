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
  crosstrade_date: string;
  traded_with: string | null;
  trade_with_name: string | null;
  trade_link: string | null;
  trade_link_second: string | null;
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
  crosstrade_date: string;
  bypass_from_balance?: number | null;
  bypass_to_balance?: number | null;
  traded_with?: string | null;
  trade_with_name?: string | null;
  trade_link?: string | null;
  trade_link_second?: string | null;
  note?: string | null;
}

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
        cct.crosstrade_date,
        cct.traded_with,
        cct.trade_with_name,
        cct.trade_link,
        cct.trade_link_second,
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
       ORDER BY cct.crosstrade_date DESC`,
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
          crosstrade_date: row.crosstrade_date,
          traded_with: row.traded_with,
          trade_with_name: row.trade_with_name,
          trade_link: row.trade_link,
          trade_link_second: row.trade_link_second,
          note: row.note,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }))
      : [];

    await redis.set(cacheKey, data, { ex: SINGLE_USER_CROSSTRADES_TTL });

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
      crosstrade_date,
      bypass_from_balance,
      bypass_to_balance,
      traded_with,
      trade_with_name,
      trade_link,
      trade_link_second,
      note,
    } = body;

    // ── Required field checks ──────────────────────────────────────────────────
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

    // ── Crosstrade date validation ─────────────────────────────────────────────
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

    // Parse and re-format to a consistent stored string
    const parsedDate = new Date(crosstrade_date);
    const storedCrossTradeDate = parsedDate.toISOString();

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

    if (bypass_from_balance !== undefined && bypass_from_balance !== null) {
      if (!Number.isInteger(bypass_from_balance) || bypass_from_balance < 0) {
        return NextResponse.json(
          {
            success: false,
            error: "bypass_from_balance must be a non-negative integer",
          },
          { status: 400 }
        );
      }
    }

    if (bypass_to_balance !== undefined && bypass_to_balance !== null) {
      if (!Number.isInteger(bypass_to_balance) || bypass_to_balance < 0) {
        return NextResponse.json(
          {
            success: false,
            error: "bypass_to_balance must be a non-negative integer",
          },
          { status: 400 }
        );
      }
    }

    await initServer();
    const pool = db();

    // ── Ownership checks ───────────────────────────────────────────────────────
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

    // ── Bot checks ─────────────────────────────────────────────────────────────
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

    if (bypass_from_balance === undefined || bypass_from_balance === null) {
      if (fromBalance < from_amount) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient balance. Available: ${fromBalance} ${fromBotCheck[0].currency_name}, Requested: ${from_amount}`,
          },
          { status: 400 }
        );
      }
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
          crosstrade_date,
          traded_with, trade_with_name, trade_link, trade_link_second, note,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          storedCrossTradeDate,
          traded_with?.trim() || null,
          trade_with_name?.trim() || null,
          trade_link?.trim() || null,
          trade_link_second?.trim() || null,
          note?.trim() || null,
          now,
          now,
        ]
      );

      // ── Update giving bot balance ───────────────────────────────────────────
      if (bypass_from_balance !== null && bypass_from_balance !== undefined) {
        await connection.execute(
          `UPDATE selected_bot SET balance = ?, last_currency_crosstraded_at = ?, updated_at = ?
           WHERE id = ? AND bot_account_id = ?`,
          [
            bypass_from_balance,
            now,
            now,
            from_selected_bot_id,
            from_bot_account_id,
          ]
        );
      } else {
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
      }

      // ── Update receiving bot balance ────────────────────────────────────────
      if (bypass_to_balance !== null && bypass_to_balance !== undefined) {
        await connection.execute(
          `UPDATE selected_bot SET balance = ?, last_currency_crosstraded_at = ?, updated_at = ?
           WHERE id = ? AND bot_account_id = ?`,
          [bypass_to_balance, now, now, to_selected_bot_id, to_bot_account_id]
        );
      } else {
        await connection.execute(
          `UPDATE selected_bot SET balance = balance + ?, last_currency_crosstraded_at = ?, updated_at = ?
           WHERE id = ? AND bot_account_id = ?`,
          [to_amount, now, now, to_selected_bot_id, to_bot_account_id]
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
        "crosstrade_entry",
        `@${actor.name} inserted a new currency crosstrade`,
        {
          trade_id: tradeId,
          from_amount,
          from_currency: fromBotCheck[0].currency_name,
          to_amount,
          to_currency: toBotCheck[0].currency_name,
          crosstrade_date: storedCrossTradeDate,
          bypass_from_balance: bypass_from_balance ?? null,
          bypass_to_balance: bypass_to_balance ?? null,
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
