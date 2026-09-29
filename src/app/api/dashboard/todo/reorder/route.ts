import { NextResponse } from "next/server";
import { initServer, db } from "../../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { isUserBanned } from "../../../../../utils/Variables/getUserBanned";
import { invalidateUserCache } from "../../../../../utils/Redis/invalidateUserRedisData";

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 },
      );
    }

    const banned = await isUserBanned();

    if (banned) {
      return NextResponse.json(
        { error: "You are banned. Contact admin" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { order } = body;

    if (!Array.isArray(order) || order.some((id) => typeof id !== "string")) {
      return NextResponse.json(
        { error: "Order must be an array of note ids" },
        { status: 400 },
      );
    }

    await initServer();
    const pool = db();

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      for (let i = 0; i < order.length; i++) {
        await connection.execute(
          `UPDATE user_notes SET sort_order = ? WHERE id = ? AND user_id = ?`,
          [i, order[i], session.user.id],
        );
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    await invalidateUserCache(session.user.id);

    return NextResponse.json(
      { success: true, message: "Notes reordered successfully" },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error reordering notes:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
