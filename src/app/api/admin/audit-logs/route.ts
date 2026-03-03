/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { initServer, db } from "../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");
    const username = searchParams.get("username");
    const action = searchParams.get("action");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const currentPage = Math.max(1, page);
    const itemsPerPage = Math.min(100, Math.max(1, limit));
    const offset = (currentPage - 1) * itemsPerPage;

    await initServer();
    const pool = db();

    const whereConditions: string[] = [];
    const queryParams: any[] = [];

    if (userId) {
      whereConditions.push("user_id = ?");
      queryParams.push(userId);
    }

    if (email) {
      whereConditions.push("actor_email LIKE ?");
      queryParams.push(`%${email}%`);
    }

    if (username) {
      whereConditions.push("actor_name LIKE ?");
      queryParams.push(`%${username}%`);
    }

    if (action) {
      whereConditions.push("action_type = ?");
      queryParams.push(action);
    }

    if (fromDate) {
      whereConditions.push("performed_at >= ?");
      queryParams.push(fromDate);
    }

    if (toDate) {
      whereConditions.push("performed_at <= ?");
      queryParams.push(toDate);
    }

    const whereClause =
      whereConditions.length > 0
        ? "WHERE " + whereConditions.join(" AND ")
        : "";

    const countQuery = `
      SELECT COUNT(*) as total 
      FROM audit_logs 
      ${whereClause}
    `;

    const [countResult] = await pool.query<any[]>(
      countQuery,
      queryParams.length > 0 ? queryParams : []
    );

    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const logsQuery = `
      SELECT * FROM audit_logs 
      ${whereClause}
      ORDER BY performed_at DESC 
      LIMIT ${itemsPerPage} OFFSET ${offset}
    `;

    const [auditLogs] = await pool.query<any[]>(
      logsQuery,
      queryParams.length > 0 ? queryParams : []
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
        logs: parsedLogs,
        pagination: {
          current_page: currentPage,
          items_per_page: itemsPerPage,
          total_items: totalItems,
          total_pages: totalPages,
          has_next: currentPage < totalPages,
          has_previous: currentPage > 1,
        },
      },
    });
  } catch (error: unknown) {
    console.error("Audit logs API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
