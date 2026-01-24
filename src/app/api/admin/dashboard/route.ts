/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initServer, db } from "../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    if (!session.user.is_admin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    await initServer();
    const pool = db();

    const [totalUsers] = await pool.execute<any[]>(
      "SELECT COUNT(*) as count FROM users"
    );

    const [auditLogs] = await pool.execute<any[]>(
      `SELECT * FROM audit_logs 
       ORDER BY performed_at DESC 
       LIMIT 20`
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
          total_users: totalUsers[0].count,
        },
        auditLogs: parsedLogs,
      },
    });
  } catch (error: unknown) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
