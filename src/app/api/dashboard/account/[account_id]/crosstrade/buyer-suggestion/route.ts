/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initServer, db } from "../../../../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../auth/[...nextauth]/route";

export interface BuyerSuggestion {
  traded_with: string;
  trade_with_name: string;
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

    const { searchParams } = new URL(request.url);
    const tradedWith = searchParams.get("traded_with")?.trim() || "";
    const tradeWithName = searchParams.get("trade_with_name")?.trim() || "";

    if (!tradedWith && !tradeWithName) {
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    await initServer();
    const pool = db();

    let rows: any[] = [];

    if (tradedWith) {
      // Exact buyer ID match across both tables -> suggest name
      [rows] = await pool.execute<any[]>(
        `SELECT traded_with, trade_with_name, MAX(crosstrade_date) AS last_date
         FROM (
           SELECT traded_with, trade_with_name, crosstrade_date
           FROM crosstrades
           WHERE user_id = ? AND traded_with = ?
             AND trade_with_name IS NOT NULL AND trade_with_name != ''
           UNION ALL
           SELECT traded_with, trade_with_name, crosstrade_date
           FROM currency_crosstrades
           WHERE user_id = ? AND traded_with = ?
             AND trade_with_name IS NOT NULL AND trade_with_name != ''
         ) AS combined
         GROUP BY traded_with, trade_with_name
         ORDER BY last_date DESC
         LIMIT 1`,
        [session.user.id, tradedWith, session.user.id, tradedWith]
      );
    } else if (tradeWithName) {
      // Partial name match across both tables -> suggest id(s)
      [rows] = await pool.execute<any[]>(
        `SELECT traded_with, trade_with_name, MAX(crosstrade_date) AS last_date
         FROM (
           SELECT traded_with, trade_with_name, crosstrade_date
           FROM crosstrades
           WHERE user_id = ? AND trade_with_name LIKE ?
             AND traded_with IS NOT NULL AND traded_with != ''
           UNION ALL
           SELECT traded_with, trade_with_name, crosstrade_date
           FROM currency_crosstrades
           WHERE user_id = ? AND trade_with_name LIKE ?
             AND traded_with IS NOT NULL AND traded_with != ''
         ) AS combined
         GROUP BY traded_with, trade_with_name
         ORDER BY last_date DESC
         LIMIT 5`,
        [
          session.user.id,
          `%${tradeWithName}%`,
          session.user.id,
          `%${tradeWithName}%`,
        ]
      );
    }

    const suggestions: BuyerSuggestion[] = (rows || []).map((r) => ({
      traded_with: r.traded_with,
      trade_with_name: r.trade_with_name,
    }));

    return NextResponse.json(
      { success: true, data: suggestions },
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
