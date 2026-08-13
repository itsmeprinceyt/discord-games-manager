/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initServer, db } from "../../../../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../auth/[...nextauth]/route";

export interface LastConversionRateResponse {
  conversion_rate: number;
}

export async function GET(
  _request: Request,
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

    await initServer();
    const pool = db();

    const [accountOwnership] = await pool.execute<any[]>(
      `SELECT id FROM bot_accounts WHERE id = ? AND user_id = ?`,
      [account_id, session.user.id]
    );

    if (!Array.isArray(accountOwnership) || accountOwnership.length === 0) {
      return NextResponse.json(
        { success: false, error: "Account not found or access denied" },
        { status: 403 }
      );
    }

    const [rows] = await pool.execute<any[]>(
      `SELECT ct.conversion_rate 
      FROM crosstrades ct
      INNER JOIN bot_accounts ba ON ba.id = ct.bot_account_id
      WHERE ba.user_id = ? 
        AND ct.currency = 'usd' 
        AND ct.conversion_rate IS NOT NULL 
        AND ct.conversion_rate > 0
      ORDER BY ct.crosstrade_date DESC
      LIMIT 1`,
      [session.user.id]
    );

    const conversionRate =
      Array.isArray(rows) && rows.length > 0
        ? Number(rows[0].conversion_rate)
        : 0;

    return NextResponse.json(
      { success: true, data: { conversion_rate: conversionRate } },
      { status: 200 }
    );
  } catch (error: unknown) {
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
