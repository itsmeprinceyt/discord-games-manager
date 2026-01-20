import { NextRequest, NextResponse } from "next/server";
import { initServer, db } from "../../../../lib/initServer";
import type { Pool } from "mysql2/promise";
import bcrypt from "bcryptjs";
import { getCurrentDateTime } from "../../../../utils/Variables/getDateTime.util";
import { generateHexId } from "../../../../utils/Variables/generateHexID.util";

let pool: Pool | null = null;
async function getPool(): Promise<Pool> {
  if (!pool) {
    await initServer();
    pool = db();
  }
  return pool;
}

function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function sanitizeString(value: string, maxLen: number): string {
  return value.trim().slice(0, maxLen);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    // Validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 50) {
      return NextResponse.json(
        { error: "Username must be between 3 and 50 characters" },
        { status: 400 }
      );
    }

    const pool = await getPool();
    const now = getCurrentDateTime();

    // Check if user already exists
    const [existingUsers] = await pool.execute<any[]>(
      "SELECT id FROM users WHERE email = ? OR username = ?",
      [email, username]
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return NextResponse.json(
        { error: "Email or username already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate user ID
    const id = generateHexId(12); // Adjust based on your ID generation logic

    // Insert new user
    await pool.execute(
      "INSERT INTO users (id, username, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
      [id, username, email, passwordHash, now]
    );

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        user: { id, username, email },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
