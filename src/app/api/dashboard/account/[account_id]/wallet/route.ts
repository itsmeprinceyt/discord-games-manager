/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initServer, db } from "../../../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route";

export interface BotInfoResponse {
  id: string;
  name: string;
  currency_name: string;
  balance: number;
}

export async function GET(
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

    await initServer();
    const pool = db();

    const [results] = await pool.execute<any[]>(
      `SELECT 
            sb.id,
            sb.name,
            sb.currency_name,
            sb.balance
        FROM selected_bot sb
        WHERE sb.bot_account_id = ?
        ORDER BY sb.name ASC`,
      [accountId]
    );

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: [],
          message: "No bots found for this user",
        },
        { status: 200 }
      );
    }

    const bots: BotInfoResponse[] = results.map((row) => ({
      id: row.id,
      name: row.name,
      currency_name: row.currency_name,
      balance: row.balance || 0,
    }));

    return NextResponse.json(
      {
        success: true,
        data: bots,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error fetching user bots:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
