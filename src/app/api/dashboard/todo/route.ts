/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initServer, db } from "../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { isUserBanned } from "../../../../utils/Variables/getUserBanned";
import { nanoid } from "nanoid";

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
        title,
        note,
        sort_order,
        created_at,
        updated_at
       FROM user_notes
       WHERE user_id = ?
       ORDER BY sort_order ASC`,
      [session.user.id],
    );

    return NextResponse.json(
      {
        success: true,
        data: results,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error fetching notes:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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
    const { title, note } = body;

    if (note !== undefined && typeof note !== "string") {
      return NextResponse.json(
        { error: "Note must be a string" },
        { status: 400 },
      );
    }

    if (title !== undefined && title !== null && typeof title !== "string") {
      return NextResponse.json(
        { error: "Title must be a string" },
        { status: 400 },
      );
    }

    if (title && title.length > 100) {
      return NextResponse.json(
        { error: "Title cannot exceed 100 characters" },
        { status: 400 },
      );
    }

    if (note && note.length > 5000) {
      return NextResponse.json(
        { error: "Note cannot exceed 5000 characters" },
        { status: 400 },
      );
    }

    await initServer();
    const pool = db();

    const [maxOrderResult] = await pool.execute<any[]>(
      `SELECT COALESCE(MAX(sort_order), -1) AS max_order
       FROM user_notes
       WHERE user_id = ?`,
      [session.user.id],
    );

    const nextOrder = (maxOrderResult[0]?.max_order ?? -1) + 1;
    const id = nanoid(12);
    const now = new Date().toISOString();

    await pool.execute(
      `INSERT INTO user_notes (id, user_id, title, note, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, session.user.id, title || null, note || "", nextOrder, now],
    );

    return NextResponse.json(
      {
        success: true,
        message: "Note created successfully",
        data: {
          id,
          title: title || null,
          note: note || "",
          sort_order: nextOrder,
          created_at: now,
          updated_at: now,
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Error creating note:", error);

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
