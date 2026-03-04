/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initServer, db } from "../../../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { getRedis } from "../../../../../../lib/Redis/redis";
import getWalletInfo from "../../../../../../utils/Redis/getWalletInfo";
import { GET_WALLET_INFO_TTL } from "../../../../../../utils/Redis/redisTTL";

export interface BotInfoResponse {
  id: string;
  name: string;
  currency_name: string;
  balance: number;
}

export async function GET(
  req: Request,
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
    const redis = getRedis();
    const cacheKey = `${getWalletInfo()}:${session.user.id}:${accountId}`;

    const cached = await redis.get<BotInfoResponse[]>(cacheKey);
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
        {
          error: "Account not found or you don't have permission to access it",
        },
        { status: 404 }
      );
    }

    const [results] = await pool.execute<any[]>(
      `SELECT 
        sb.id,
        sb.name,
        sb.currency_name,
        sb.balance
       FROM selected_bot sb
       WHERE sb.bot_account_id = ? AND (sb.blacklisted = FALSE OR sb.blacklisted IS NULL)
       ORDER BY sb.name ASC`,
      [accountId]
    );

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: [],
          message: "No active bots found for this account",
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

    await redis.set(cacheKey, bots, { ex: GET_WALLET_INFO_TTL });

    return NextResponse.json({ success: true, data: bots }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching user bots:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
