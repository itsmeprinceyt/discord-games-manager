/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initServer, db } from "../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// TODO: put in a file
export interface BotAccountResponse {
  id: string;
  name: string;
  account_uid: string | null;
  created_at: string;
  updated_at: string;
  selected_bots: SelectedBotResponse[];
}

interface SelectedBotResponse {
  name: string;
  currency_name: string;
  balance: number;
  last_crosstraded_at: string | null;
  voted_at: string | null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
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
       WHERE ba.user_id = ?
       ORDER BY ba.name ASC, sb.name ASC`,
      [session.user.id]
    );

    if (!Array.isArray(results)) {
      return NextResponse.json(
        {
          success: true,
          data: [],
          count: 0,
        },
        { status: 200 }
      );
    }

    const accountsMap = new Map<string, BotAccountResponse>();

    results.forEach((row) => {
      const accountId = row.id;

      if (!accountsMap.has(accountId)) {
        accountsMap.set(accountId, {
          id: row.id,
          name: row.name,
          account_uid: row.account_uid,
          created_at: row.created_at,
          updated_at: row.updated_at,
          selected_bots: [],
        });
      }

      if (row.selected_bot_name) {
        const account = accountsMap.get(accountId)!;
        account.selected_bots.push({
          name: row.selected_bot_name,
          currency_name: row.currency_name,
          balance: row.balance || 0,
          last_crosstraded_at: row.last_crosstraded_at,
          voted_at: row.voted_at,
        });
      }
    });

    const formattedAccounts = Array.from(accountsMap.values());

    return NextResponse.json(
      {
        success: true,
        data: formattedAccounts,
        count: formattedAccounts.length,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error fetching bot accounts:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
