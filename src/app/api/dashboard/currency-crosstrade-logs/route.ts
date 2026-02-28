/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initServer, db } from "../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getRedis } from "../../../../lib/Redis/redis";
import { SINGLE_USER_CROSSTRADES_TTL } from "../../../../utils/Redis/redisTTL";
import getCurrencyCrosstradeLogsRedisKeyAll from "../../../../utils/Redis/getCurrencyCrosstradeLogsRedisKeyAll";

interface UserCurrencyCrossTradeLog {
  id: string;
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

export interface UserCurrencyCrossTradesResponse {
  currency_crosstrade_logs: UserCurrencyCrossTradeLog[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
  filters?: {
    bot_accounts: Array<{ id: string; name: string }>;
    from_bot_names: string[];
    to_bot_names: string[];
    from_currencies: string[];
    to_currencies: string[];
  };
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const targetUserId = session.user.id;

    if (session.user.id !== targetUserId && !session.user.is_admin) {
      return NextResponse.json(
        {
          success: false,
          error: "You don't have permission to view this user's data",
        },
        { status: 403 }
      );
    }

    await initServer();
    const redis = getRedis();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const from_bot_account_id = searchParams.get("from_bot_account_id");
    const to_bot_account_id = searchParams.get("to_bot_account_id");
    const from_currency_name = searchParams.get("from_currency_name");
    const to_currency_name = searchParams.get("to_currency_name");
    const from_bot_name = searchParams.get("from_bot_name");
    const to_bot_name = searchParams.get("to_bot_name");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");

    const cacheKey = `${getCurrencyCrosstradeLogsRedisKeyAll()}:${targetUserId}:p${page}:l${limit}:${
      from_bot_account_id || ""
    }:${to_bot_account_id || ""}:${from_currency_name || ""}:${
      to_currency_name || ""
    }:${from_bot_name || ""}:${to_bot_name || ""}:${start_date || ""}:${
      end_date || ""
    }`;

    const cached = await redis.get<UserCurrencyCrossTradesResponse>(cacheKey);
    if (cached) {
      return NextResponse.json(
        { success: true, data: cached },
        { status: 200 }
      );
    }

    const pool = db();

    let whereClause = "WHERE cct.user_id = ?";
    const queryParams: any[] = [targetUserId];

    if (from_bot_account_id) {
      whereClause += " AND cct.from_bot_account_id = ?";
      queryParams.push(from_bot_account_id);
    }

    if (to_bot_account_id) {
      whereClause += " AND cct.to_bot_account_id = ?";
      queryParams.push(to_bot_account_id);
    }

    if (from_currency_name) {
      whereClause += " AND cct.from_currency_name = ?";
      queryParams.push(from_currency_name);
    }

    if (to_currency_name) {
      whereClause += " AND cct.to_currency_name = ?";
      queryParams.push(to_currency_name);
    }

    if (from_bot_name) {
      whereClause += " AND from_sb.name = ?";
      queryParams.push(from_bot_name);
    }

    if (to_bot_name) {
      whereClause += " AND to_sb.name = ?";
      queryParams.push(to_bot_name);
    }

    if (start_date) {
      whereClause += " AND cct.created_at >= ?";
      queryParams.push(start_date);
    }

    if (end_date) {
      whereClause += " AND cct.created_at <= ?";
      queryParams.push(end_date);
    }

    const [countResult] = await pool.execute<any[]>(
      `SELECT COUNT(*) as total
       FROM currency_crosstrades cct
       JOIN selected_bot from_sb ON cct.from_selected_bot_id = from_sb.id
       JOIN selected_bot to_sb ON cct.to_selected_bot_id = to_sb.id
       JOIN bot_accounts from_ba ON cct.from_bot_account_id = from_ba.id
       JOIN bot_accounts to_ba ON cct.to_bot_account_id = to_ba.id
       ${whereClause}`,
      queryParams
    );

    const totalCount =
      Array.isArray(countResult) && countResult.length > 0
        ? Number(countResult[0].total)
        : 0;

    const [currencyCrossTrades] = await pool.execute<any[]>(
      `SELECT
          cct.id,
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
       JOIN selected_bot from_sb ON cct.from_selected_bot_id = from_sb.id
       JOIN selected_bot to_sb ON cct.to_selected_bot_id = to_sb.id
       JOIN bot_accounts from_ba ON cct.from_bot_account_id = from_ba.id
       JOIN bot_accounts to_ba ON cct.to_bot_account_id = to_ba.id
       ${whereClause}
       ORDER BY cct.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit.toString(), offset.toString()]
    );

    // Filter options
    const [botAccounts] = await pool.execute<any[]>(
      `SELECT DISTINCT ba.id, ba.name
       FROM bot_accounts ba
       WHERE ba.user_id = ?
       ORDER BY ba.name`,
      [targetUserId]
    );

    const [fromBotNames] = await pool.execute<any[]>(
      `SELECT DISTINCT from_sb.name
       FROM currency_crosstrades cct
       JOIN selected_bot from_sb ON cct.from_selected_bot_id = from_sb.id
       WHERE cct.user_id = ?
       ORDER BY from_sb.name`,
      [targetUserId]
    );

    const [toBotNames] = await pool.execute<any[]>(
      `SELECT DISTINCT to_sb.name
       FROM currency_crosstrades cct
       JOIN selected_bot to_sb ON cct.to_selected_bot_id = to_sb.id
       WHERE cct.user_id = ?
       ORDER BY to_sb.name`,
      [targetUserId]
    );

    const [fromCurrencies] = await pool.execute<any[]>(
      `SELECT DISTINCT from_currency_name
       FROM currency_crosstrades
       WHERE user_id = ?
       ORDER BY from_currency_name`,
      [targetUserId]
    );

    const [toCurrencies] = await pool.execute<any[]>(
      `SELECT DISTINCT to_currency_name
       FROM currency_crosstrades
       WHERE user_id = ?
       ORDER BY to_currency_name`,
      [targetUserId]
    );

    const currencyCrossTradeLog: UserCurrencyCrossTradeLog[] = Array.isArray(
      currencyCrossTrades
    )
      ? currencyCrossTrades.map((trade) => ({
          id: trade.id,
          from_bot_account_id: trade.from_bot_account_id,
          from_bot_account_name: trade.from_bot_account_name,
          from_selected_bot_id: trade.from_selected_bot_id,
          from_bot_name: trade.from_bot_name,
          from_currency_name: trade.from_currency_name,
          from_amount: Number(trade.from_amount),
          to_bot_account_id: trade.to_bot_account_id,
          to_bot_account_name: trade.to_bot_account_name,
          to_selected_bot_id: trade.to_selected_bot_id,
          to_bot_name: trade.to_bot_name,
          to_currency_name: trade.to_currency_name,
          to_amount: Number(trade.to_amount),
          traded_with: trade.traded_with,
          trade_link: trade.trade_link,
          note: trade.note,
          created_at: trade.created_at,
          updated_at: trade.updated_at,
        }))
      : [];

    const totalPages = Math.ceil(totalCount / limit);

    const responseData: UserCurrencyCrossTradesResponse = {
      currency_crosstrade_logs: currencyCrossTradeLog,
      total_count: totalCount,
      page,
      limit,
      total_pages: totalPages,
      filters: {
        bot_accounts: botAccounts.map((acc: any) => ({
          id: acc.id,
          name: acc.name,
        })),
        from_bot_names: fromBotNames.map((b: any) => b.name),
        to_bot_names: toBotNames.map((b: any) => b.name),
        from_currencies: fromCurrencies.map((c: any) => c.from_currency_name),
        to_currencies: toCurrencies.map((c: any) => c.to_currency_name),
      },
    };

    await redis.set(cacheKey, responseData, {
      ex: SINGLE_USER_CROSSTRADES_TTL,
    });

    return NextResponse.json(
      { success: true, data: responseData },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error fetching user currency cross trade logs:", error);
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
