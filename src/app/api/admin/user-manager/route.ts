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

    const currentPage = Math.max(1, page);
    const itemsPerPage = Math.min(100, Math.max(1, limit));
    const offset = (currentPage - 1) * itemsPerPage;

    await initServer();
    const pool = db();

    // Get total users count for pagination
    const [countResult] = await pool.query<any[]>(
      `SELECT COUNT(*) as total FROM users`
    );
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Get users with basic stats
    const [users] = await pool.query<any[]>(
      `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.is_admin,
        u.created_at,
        u.updated_at
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [itemsPerPage, offset]
    );

    // For each user, fetch their bot accounts with selected bots (sorted A-Z)
    const parsedUsers = await Promise.all(
      users.map(async (user) => {
        // Fetch bot accounts for this user (sorted A-Z by name)
        const [botAccounts] = await pool.query<any[]>(
          `
          SELECT 
            ba.id,
            ba.name,
            ba.account_uid,
            ba.voted_at,
            ba.todo,
            ba.created_at,
            ba.updated_at
          FROM bot_accounts ba
          WHERE ba.user_id = ?
          ORDER BY ba.name ASC
          `,
          [user.id]
        );

        // For each bot account, fetch its selected bots (sorted A-Z by name)
        const botAccountsWithSelectedBots = await Promise.all(
          botAccounts.map(async (account) => {
            const [selectedBots] = await pool.query<any[]>(
              `
              SELECT 
                sb.id,
                sb.name,
                sb.currency_name
              FROM selected_bot sb
              WHERE sb.bot_account_id = ?
              ORDER BY sb.name ASC
              `,
              [account.id]
            );

            return {
              id: account.id,
              name: account.name,
              account_uid: account.account_uid,
              selected_bots: selectedBots.map((bot) => ({
                id: bot.id,
                name: bot.name,
                currency_name: bot.currency_name,
              })),
            };
          })
        );

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          is_admin: Boolean(user.is_admin),
          created_at: user.created_at,
          updated_at: user.updated_at,
          bot_accounts: botAccountsWithSelectedBots,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        users: parsedUsers,
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
    console.error("Users with bot accounts API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
