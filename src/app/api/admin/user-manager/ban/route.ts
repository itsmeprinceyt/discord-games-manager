/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { initServer, db } from "../../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { logAudit } from "../../../../../utils/Variables/AuditLogger.util";
import { AuditActor } from "../../../../../types/Admin/AuditLogger/auditLogger.type";
import { getCurrentDateTime } from "../../../../../utils/Variables/getDateTime.util";
import { isUserBanned } from "../../../../../utils/Variables/getUserBanned";

interface BanUserRequest {
  user_id: string;
}

export async function POST(request: NextRequest) {
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

    const banned = await isUserBanned();
    if (banned) {
      return NextResponse.json(
        { error: "You are banned. Contact admin" },
        { status: 403 }
      );
    }

    const body: BanUserRequest = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (user_id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot ban/unban yourself" },
        { status: 400 }
      );
    }

    await initServer();
    const pool = db();

    const [userCheck] = await pool.execute<any[]>(
      `SELECT id, username, email, is_banned FROM users WHERE id = ?`,
      [user_id]
    );

    if (!Array.isArray(userCheck) || userCheck.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUser = userCheck[0];
    const currentBanStatus = Boolean(targetUser.is_banned);
    const newBanStatus = !currentBanStatus;
    const now = getCurrentDateTime();

    await pool.execute(
      `UPDATE users SET is_banned = ?, updated_at = ? WHERE id = ?`,
      [newBanStatus ? 1 : 0, now, user_id]
    );

    const actor: AuditActor = {
      user_id: session.user.id,
      email: session.user.email,
      name: session.user.username,
    };

    await logAudit(
      actor,
      newBanStatus ? "user_ban" : "user_unban",
      `@${actor.name} ${newBanStatus ? "banned" : "unbanned"} user @${
        targetUser.username
      } (${targetUser.email})`,
      {
        target_user_id: user_id,
        target_username: targetUser.username,
        target_email: targetUser.email,
        previous_status: currentBanStatus,
        new_status: newBanStatus,
      }
    );

    return NextResponse.json({
      success: true,
      message: `User ${newBanStatus ? "banned" : "unbanned"} successfully`,
      data: {
        user_id,
        is_banned: newBanStatus,
      },
    });
  } catch (error: unknown) {
    console.error("Ban user API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
