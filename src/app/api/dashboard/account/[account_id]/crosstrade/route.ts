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

interface BotAssociated {
  id: string;
  name: string;
}

interface CrossTradeLog {
  id: string;
  bot_name: string;
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

export interface CombinedResponse {
  bot_associated: BotAssociated[];
  cross_trade_logs: CrossTradeLog[];
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
    const pool = db();

    const [accountOwnership] = await pool.execute<any[]>(
      `
      SELECT id FROM bot_accounts 
      WHERE id = ? AND user_id = ?
    `,
      [accountId, session.user.id]
    );

    if (!Array.isArray(accountOwnership) || accountOwnership.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Bot account not found or you don't have permission to access it",
        },
        { status: 403 }
      );
    }

    const [selectedBots] = await pool.execute<any[]>(
      `
      SELECT 
        id,
        name
      FROM selected_bot
      WHERE bot_account_id = ?
      ORDER BY name ASC
    `,
      [accountId]
    );

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
        sb.name AS bot_name
      FROM crosstrades ct
      JOIN selected_bot sb
      ON ct.selected_bot_id = sb.id
      WHERE ct.bot_account_id = ? AND ct.user_id = ?
      ORDER BY ct.crosstrade_date DESC
    `,
      [accountId, session.user.id] // Added user_id check here too
    );

    const botAssociated: BotAssociated[] = Array.isArray(selectedBots)
      ? selectedBots.map((bot) => ({
          id: bot.id,
          name: bot.name,
        }))
      : [];

    const crossTradeLogs: CrossTradeLog[] = Array.isArray(crossTrades)
      ? crossTrades.map((trade) => ({
          id: trade.id,
          crosstrade_date: trade.crosstrade_date,
          bot_name: trade.bot_name,
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

    const responseData: CombinedResponse = {
      bot_associated: botAssociated,
      cross_trade_logs: crossTradeLogs,
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error fetching admin data:", error);

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

// TODO: put in the file
export interface CrossTradeRequestAPI {
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
  bot_id?: string;
  bot_account_id?: string;
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
      trade_link,
      traded,
      paid,
      note,
      bot_id,
      bot_account_id,
    } = body as CrossTradeRequestAPI;

    const requiredFields = [
      "crosstrade_date",
      "currency",
      "crosstrade_via",
      "amount_received",
      "bot_id",
      "bot_account_id",
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

    const [botValidation] = await pool.execute<any[]>(
      `
      SELECT id FROM selected_bot 
      WHERE id = ? AND bot_account_id = ?
    `,
      [bot_id, bot_account_id]
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
        typeof conversion_rate !== "number" ||
        conversion_rate <= 0)
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

    const crosstradeId = generateHexId(12);
    const now = getCurrentDateTime();

    connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const insertCrosstradeQuery = `
        INSERT INTO crosstrades (
          id, user_id, bot_account_id, selected_bot_id,
          crosstrade_date, currency, crosstrade_via, amount_received,
          rate, conversion_rate, net_amount, traded_with,
          trade_link, traded, paid, note, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await connection.execute(insertCrosstradeQuery, [
        crosstradeId,
        session.user.id,
        bot_account_id,
        bot_id,
        crosstrade_date,
        currency,
        crosstrade_via,
        amount_received,
        rate,
        conversion_rate,
        net_amount,
        traded_with,
        trade_link,
        traded,
        paid,
        note,
        now,
        now,
      ]);

      await connection.execute(
        `
        UPDATE selected_bot 
          SET last_crosstraded_at = ?,
              updated_at = ?
        WHERE id = ? AND bot_account_id = ?`,
        [crosstrade_date, now, bot_id, bot_account_id]
      );

      await connection.commit();

      const actor: AuditActor = {
        user_id: session.user.id,
        email: session.user.email,
        name: session.user.username,
      };

      await logAudit(
        actor,
        "user_action",
        `User inserted a new crosstrade #${crosstradeId}`,
        {
          user_id: session.user.id,
          bot_id: bot_id,
          bot_account_id: bot_account_id,
        }
      );

      return NextResponse.json(
        {
          success: true,
          message: "Cross trade created successfully",
        },
        { status: 201 }
      );
    } catch (dbError: unknown) {
      if (connection) {
        await connection.rollback();
      }
      console.error("Database error:", dbError);
      throw dbError;
    }
  } catch (error: unknown) {
    console.error("Error processing cross trade:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
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
