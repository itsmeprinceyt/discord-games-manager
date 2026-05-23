/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initServer, db } from "../../../../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../auth/[...nextauth]/route";

export async function GET(
  _request: Request,
  context: { params: Promise<{ account_id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 },
      );
    }

    const { account_id } = await context.params;

    await initServer();
    const pool = db();

    // Verify ownership first
    const [accountOwnership] = await pool.execute<any[]>(
      `SELECT id FROM bot_accounts WHERE id = ? AND user_id = ?`,
      [account_id, session.user.id],
    );

    if (!Array.isArray(accountOwnership) || accountOwnership.length === 0) {
      return NextResponse.json(
        { success: false, error: "Account not found or access denied" },
        { status: 403 },
      );
    }

    const [selectedBots] = await pool.execute<any[]>(
      `SELECT id, name FROM selected_bot WHERE bot_account_id = ? ORDER BY name ASC`,
      [account_id],
    );

    const bots = Array.isArray(selectedBots)
      ? selectedBots.map((bot) => ({ id: bot.id, name: bot.name }))
      : [];

    return NextResponse.json({ success: true, data: bots }, { status: 200 });
  } catch (error: unknown) {
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
