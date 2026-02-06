/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initServer, db } from "../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

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

    const [totalAccounts] = await pool.execute<any[]>(
      "SELECT COUNT(*) as count FROM bot_accounts WHERE user_id = ?",
      [session.user.id]
    );

    const [totalTrades] = await pool.execute<any[]>(
      `SELECT COUNT(*) as count FROM crosstrades 
       WHERE user_id = ?`,
      [session.user.id]
    );

    // Get user's latest 20 audit logs
    // Only include logs where:
    // 1. actor_user_id = user's id (actions performed by the user)
    // 2. target_user_id = user's id (actions performed on the user)
    const [auditLogs] = await pool.execute<any[]>(
      `SELECT * FROM audit_logs 
       WHERE actor_user_id = ? OR target_user_id = ?
       ORDER BY performed_at DESC 
       LIMIT 20`,
      [session.user.id, session.user.id]
    );

    const parsedLogs = auditLogs.map((log) => {
      let meta = null;

      try {
        if (log.meta) {
          if (typeof log.meta === "string") {
            meta = JSON.parse(log.meta);
          } else if (typeof log.meta === "object") {
            meta = log.meta;
          }
        }
      } catch (error) {
        console.error("Error parsing meta for log", log.id, ":", error);
        meta = null;
      }

      return {
        ...log,
        meta,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          total_accounts: totalAccounts[0].count,
          total_trades: totalTrades[0].count,
        },
        auditLogs: parsedLogs,
      },
    });
  } catch (error: unknown) {
    console.error("User dashboard error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
