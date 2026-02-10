/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initServer, db } from "../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

interface UserCrossTradeLog {
  id: string;
  bot_name: string;
  bot_account_id: string;
  bot_account_name: string;
  crosstrade_date: string;
  currency: "inr" | "usd";
  crosstrade_via: "upi" | "paypal" | "wise";
  amount_received: number;
  rate: string | null;
  conversion_rate: number | null;
  net_amount: number | null;
  traded_with: string | null;
  trade_link: string | null;
  traded: boolean;
  paid: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserCrossTradesResponse {
  cross_trade_logs: UserCrossTradeLog[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 },
      );
    }

    const targetUserId = session.user.id;

    // Only allow users to view their own data unless they're admin
    if (session.user.id !== targetUserId && !session.user.is_admin) {
      return NextResponse.json(
        {
          success: false,
          error: "You don't have permission to view this user's data",
        },
        { status: 403 },
      );
    }

    await initServer();
    const pool = db();

    // Get pagination parameters from query string
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Optional filters
    const bot_account_id = searchParams.get("bot_account_id");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");
    const currency = searchParams.get("currency");
    const crosstrade_via = searchParams.get("crosstrade_via");
    const bot_name = searchParams.get("bot_name");

    // Build WHERE clause and parameters
    let whereClause = "WHERE ct.user_id = ?";
    const queryParams: any[] = [targetUserId];

    if (bot_account_id) {
      whereClause += " AND ct.bot_account_id = ?";
      queryParams.push(bot_account_id);
    }

    if (start_date) {
      whereClause += " AND ct.crosstrade_date >= ?";
      queryParams.push(start_date);
    }

    if (end_date) {
      whereClause += " AND ct.crosstrade_date <= ?";
      queryParams.push(end_date);
    }

    if (currency) {
      whereClause += " AND ct.currency = ?";
      queryParams.push(currency);
    }

    if (crosstrade_via) {
      whereClause += " AND ct.crosstrade_via = ?";
      queryParams.push(crosstrade_via);
    }

    if (bot_name) {
      whereClause += " AND sb.name = ?";
      queryParams.push(bot_name);
    }

    // Get total count for pagination
    const [countResult] = await pool.execute<any[]>(
      `
        SELECT COUNT(*) as total 
        FROM crosstrades ct
        JOIN selected_bot sb ON ct.selected_bot_id = sb.id
        JOIN bot_accounts ba ON ct.bot_account_id = ba.id
        ${whereClause}
        `,
      queryParams, // Only the WHERE clause params, no LIMIT/OFFSET
    );

    const totalCount =
      Array.isArray(countResult) && countResult.length > 0
        ? Number(countResult[0].total)
        : 0;

    // Get cross-trades with pagination
    const [crossTrades] = await pool.execute<any[]>(
      `
        SELECT
            ct.id,
            ct.crosstrade_date,
            ct.currency,
            ct.crosstrade_via,
            ct.amount_received,
            ct.rate,
            ct.conversion_rate,
            ct.net_amount,
            ct.traded_with,
            ct.trade_link,
            ct.traded,
            ct.paid,
            ct.note,
            ct.created_at,
            ct.updated_at,
            sb.name AS bot_name,
            ba.id AS bot_account_id,
            ba.name AS bot_account_name
        FROM crosstrades ct
        JOIN selected_bot sb ON ct.selected_bot_id = sb.id
        JOIN bot_accounts ba ON ct.bot_account_id = ba.id
        ${whereClause}
        ORDER BY ct.crosstrade_date DESC, ct.created_at DESC
        LIMIT ? OFFSET ?
        `,
      [...queryParams, limit.toString(), offset.toString()], // Convert to strings
    );

    const crossTradeLogs: UserCrossTradeLog[] = Array.isArray(crossTrades)
      ? crossTrades.map((trade) => ({
          id: trade.id,
          crosstrade_date: trade.crosstrade_date,
          bot_name: trade.bot_name,
          bot_account_id: trade.bot_account_id,
          bot_account_name: trade.bot_account_name,
          currency: trade.currency,
          crosstrade_via: trade.crosstrade_via,
          amount_received: Number(trade.amount_received),
          rate: trade.rate,
          conversion_rate: trade.conversion_rate
            ? Number(trade.conversion_rate)
            : null,
          net_amount: trade.net_amount ? Number(trade.net_amount) : null,
          traded_with: trade.traded_with,
          trade_link: trade.trade_link,
          traded: Boolean(trade.traded),
          paid: Boolean(trade.paid),
          note: trade.note,
          created_at: trade.created_at,
          updated_at: trade.updated_at,
        }))
      : [];

    const totalPages = Math.ceil(totalCount / limit);

    const responseData: UserCrossTradesResponse = {
      cross_trade_logs: crossTradeLogs,
      total_count: totalCount,
      page: page,
      limit: limit,
      total_pages: totalPages,
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error fetching user cross trade logs:", error);

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
