/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { initServer, db } from "../../../../lib/initServer";
import bcrypt from "bcryptjs";
import { getCurrentDateTime } from "../../../../utils/Variables/getDateTime.util";
import { generateHexId } from "../../../../utils/Variables/generateHexID.util";
import { isValidEmail } from "../../../../utils/Validator/NextAuth.util";
import prepareUsername from "../../../../utils/Validator/PrepareUsername.util";
import { logAudit } from "../../../../utils/Variables/AuditLogger.util";
import { AuditActor } from "../../../../types/Admin/AuditLogger/auditLogger.type";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedEmail || !trimmedPassword) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    if (!isValidEmail(trimmedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    if (trimmedPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 },
      );
    }

    const preparedUsername = prepareUsername(trimmedUsername);

    if (preparedUsername.length < 3 || preparedUsername.length > 50) {
      return NextResponse.json(
        { error: "Username must be between 3 and 50 characters" },
        { status: 400 },
      );
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(trimmedPassword)) {
      return NextResponse.json(
        { error: "Password must contain at least one letter and one number" },
        { status: 400 },
      );
    }

    await initServer();
    const pool = db();
    const now = getCurrentDateTime();

    const [existingUsers] = await pool.execute<any[]>(
      "SELECT id FROM users WHERE email = ? OR username = ?",
      [trimmedEmail, preparedUsername],
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return NextResponse.json(
        { error: "Email or username already exists" },
        { status: 409 },
      );
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(trimmedPassword, saltRounds);
    const id = generateHexId(12);

    await pool.execute(
      "INSERT INTO users (id, username, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
      [id, preparedUsername, trimmedEmail, passwordHash, now],
    );

    const newUser: AuditActor = {
      user_id: id,
      email: trimmedEmail,
      name: preparedUsername,
    };

    await logAudit(
      newUser,
      "user_signup",
      `@${preparedUsername} registered successfully`,
      {},
    );

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        userId: id,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
