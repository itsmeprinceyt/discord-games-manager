/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initServer, db } from "../../../../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../auth/[...nextauth]/route";
import { isUserBanned } from "../../../../../../../utils/Variables/getUserBanned";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const banned = await isUserBanned();
    if (banned) {
      return NextResponse.json(
        { error: "You are banned. Contact admin" },
        { status: 403 }
      );
    }

    await initServer();
    const pool = db();

    const [accounts] = await pool.execute<any[]>(
      `SELECT id, name FROM bot_accounts WHERE user_id = ? ORDER BY name ASC`,
      [session.user.id]
    );

    return NextResponse.json(
      { success: true, data: accounts },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
