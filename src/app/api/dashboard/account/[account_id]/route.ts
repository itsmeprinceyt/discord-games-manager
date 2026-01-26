/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initServer, db } from "../../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

// TODO: put in a file
export interface BotAccountResponse {
  id: string;
  name: string;
  account_uid: string | null;
  created_at: string;
  updated_at: string;
  selected_bots: SelectedBotResponse[];
  trade_count: number;
}

interface SelectedBotResponse {
  name: string;
  currency_name: string;
  balance: number;
  last_crosstraded_at: string | null;
  voted_at: string | null;
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

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    await initServer();
    const pool = db();

    const [results] = await pool.execute<any[]>(
      `SELECT 
        ba.id,
        ba.name,
        ba.account_uid,
        ba.created_at,
        ba.updated_at,
        sb.name as selected_bot_name,
        sb.currency_name,
        sb.balance,
        sb.last_crosstraded_at,
        sb.voted_at
       FROM bot_accounts ba
       LEFT JOIN selected_bot sb ON ba.id = sb.bot_account_id
       WHERE ba.user_id = ? AND ba.id = ?
       ORDER BY sb.name ASC`,
      [session.user.id, accountId]
    );

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Account not found or you don't have permission to access it",
        },
        { status: 404 }
      );
    }

    const [tradeCountResult] = await pool.execute<any[]>(
      `SELECT COUNT(*) as total_trades
       FROM crosstrades
       WHERE bot_account_id = ?`,
      [accountId]
    );

    const trade_count =
      tradeCountResult && Array.isArray(tradeCountResult) && tradeCountResult[0]
        ? Number(tradeCountResult[0].total_trades) || 0
        : 0;

    const account: BotAccountResponse = {
      id: results[0].id,
      name: results[0].name,
      account_uid: results[0].account_uid,
      created_at: results[0].created_at,
      updated_at: results[0].updated_at,
      selected_bots: [],
      trade_count: trade_count,
    };

    results.forEach((row) => {
      if (row.selected_bot_name) {
        account.selected_bots.push({
          name: row.selected_bot_name,
          currency_name: row.currency_name,
          balance: row.balance || 0,
          last_crosstraded_at: row.last_crosstraded_at,
          voted_at: row.voted_at,
        });
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: account,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error fetching bot account:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
