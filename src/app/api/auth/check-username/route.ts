/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { initServer, db } from "../../../../lib/initServer";
import prepareUsername from "../../../../utils/Validator/PrepareUsername.util";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body;
    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const preparedUsername = prepareUsername(trimmedUsername);
    if (preparedUsername.length < 3 || preparedUsername.length > 50) {
      return NextResponse.json(
        {
          available: false,
          message: "Username must be between 3 and 50 characters",
        },
        { status: 200 }
      );
    }

    if (!preparedUsername) {
      return NextResponse.json(
        {
          available: false,
          message: "Invalid username format",
        },
        { status: 200 }
      );
    }

    await initServer();
    const pool = db();

    const [existingUsers] = await pool.execute<any[]>(
      "SELECT id FROM users WHERE username = ?",
      [preparedUsername]
    );

    const isAvailable = !(
      Array.isArray(existingUsers) && existingUsers.length > 0
    );

    return NextResponse.json(
      {
        available: isAvailable,
        message: isAvailable
          ? "Username is available"
          : "Username is already taken",
        suggestedUsername: preparedUsername,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Check username error:", error);
    return NextResponse.json(
      {
        available: false,
        error: "Unable to check username availability. Please try again.",
      },
      { status: 500 }
    );
  }
}
