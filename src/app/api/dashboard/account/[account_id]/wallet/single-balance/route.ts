/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initServer, db } from "../../../../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../auth/[...nextauth]/route";

export interface SingleBotWalletResponse {
  currency_name: string;
  balance: number;
}

export async function POST(
  req: Request,
  context: {
    params: Promise<{ account_id: string }>;
  }
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

    const body = await req.json();
    const { botAccount } = body;

    if (!botAccount) {
      return NextResponse.json(
        { error: "Bot account ID is required" },
        { status: 400 }
      );
    }

    await initServer();
    const pool = db();

    const [results] = await pool.execute<any[]>(
      `SELECT
            sb.currency_name,
            sb.balance
        FROM selected_bot sb
        WHERE sb.bot_account_id = ? AND sb.id = ?
        LIMIT 1`,
      [accountId, botAccount]
    );

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Bot not found",
          message: "No bot found with the provided ID for this account",
        },
        { status: 404 }
      );
    }

    const bot = results[0];

    const walletInfo: SingleBotWalletResponse = {
      currency_name: bot.currency_name,
      balance: bot.balance || 0,
    };

    return NextResponse.json(
      {
        success: true,
        data: walletInfo,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error fetching bot wallet:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
