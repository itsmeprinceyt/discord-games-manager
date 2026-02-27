/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { initServer, db } from "../../../../lib/initServer";
import bcrypt from "bcryptjs";
import { getCurrentDateTime } from "../../../../utils/Variables/getDateTime.util";
import { logAudit } from "../../../../utils/Variables/AuditLogger.util";
import { AuditActor } from "../../../../types/Admin/AuditLogger/auditLogger.type";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Check if both passwords are provided
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    const trimmedCurrentPassword = currentPassword.trim();
    const trimmedNewPassword = newPassword.trim();

    if (!trimmedCurrentPassword || !trimmedNewPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    // Validate new password
    if (trimmedNewPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(trimmedNewPassword)) {
      return NextResponse.json(
        {
          error: "New password must contain at least one letter and one number",
        },
        { status: 400 }
      );
    }

    const user = await getServerSession(authOptions);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await initServer();
    const pool = db();
    const now = getCurrentDateTime();

    const [users] = await pool.execute<any[]>(
      "SELECT id, username, email, password_hash FROM users WHERE id = ?",
      [user.user.id]
    );

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const dbUser = users[0];

    const isPasswordValid = await bcrypt.compare(
      trimmedCurrentPassword,
      dbUser.password_hash
    );
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    const isSamePassword = await bcrypt.compare(
      trimmedNewPassword,
      dbUser.password_hash
    );
    if (isSamePassword) {
      return NextResponse.json(
        { error: "New password must be different from current password" },
        { status: 400 }
      );
    }

    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(trimmedNewPassword, saltRounds);

    await pool.execute(
      "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
      [newPasswordHash, now, dbUser.id]
    );

    const auditActor: AuditActor = {
      user_id: dbUser.id,
      email: dbUser.email,
      name: dbUser.username,
    };

    await logAudit(
      auditActor,
      "user_update",
      `@${dbUser.username} changed their password`,
      {}
    );

    return NextResponse.json(
      {
        success: true,
        message: "Password changed successfully",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
