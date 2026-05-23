/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initServer, db } from "../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { isUserBanned } from "../../../../utils/Variables/getUserBanned";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 },
      );
    }

    await initServer();
    const pool = db();

    const [results] = await pool.execute<any[]>(
      `SELECT 
        id,
        todo
       FROM users
       WHERE id = ?`,
      [session.user.id],
    );

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = results[0];

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          todo: user.todo || "",
        },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error fetching todo:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

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
    const { todo } = body;

    // Validate todo
    if (todo !== undefined && typeof todo !== "string") {
      return NextResponse.json(
        { error: "Todo must be a string" },
        { status: 400 },
      );
    }

    await initServer();
    const pool = db();

    const updatedAt = new Date().toISOString();
    const todoValue = todo !== undefined ? todo : "";

    const [updateResult] = await pool.execute<any[]>(
      `UPDATE users
       SET todo = ?, updated_at = ?
       WHERE id = ?`,
      [todoValue, updatedAt, session.user.id],
    );

    if ((updateResult as any).affectedRows === 0) {
      return NextResponse.json(
        { error: "Failed to update todo" },
        { status: 404 },
      );
    }

    const [updatedResults] = await pool.execute<any[]>(
      `SELECT
        id,
        todo,
        updated_at
       FROM users
       WHERE id = ?`,
      [session.user.id],
    );

    if (!Array.isArray(updatedResults) || updatedResults.length === 0) {
      return NextResponse.json(
        { error: "Failed to retrieve updated data" },
        { status: 500 },
      );
    }

    const updatedUser = updatedResults[0];

    return NextResponse.json(
      {
        success: true,
        message: "Todo updated successfully",
        data: {
          id: updatedUser.id,
          todo: updatedUser.todo || "",
          updated_at: updatedUser.updated_at,
        },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error updating todo:", error);

    if (error instanceof Error) {
      if (error.message.includes("JSON")) {
        return NextResponse.json(
          { error: "Invalid request body format" },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
