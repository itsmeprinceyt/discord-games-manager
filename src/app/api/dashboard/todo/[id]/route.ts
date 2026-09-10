/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initServer, db } from "../../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { isUserBanned } from "../../../../../utils/Variables/getUserBanned";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
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

    const updatedAt = new Date().toISOString();

    const [updateResult] = await pool.execute<any[]>(
      `UPDATE user_notes
       SET title = ?, note = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [
        title !== undefined ? title || null : null,
        note !== undefined ? note : "",
        updatedAt,
        id,
        session.user.id,
      ],
    );

    if ((updateResult as any).affectedRows === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Note updated successfully",
        data: {
          id,
          title: title || null,
          note: note || "",
          updated_at: updatedAt,
        },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error updating note:", error);

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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;

    await initServer();
    const pool = db();

    const [deleteResult] = await pool.execute<any[]>(
      `DELETE FROM user_notes WHERE id = ? AND user_id = ?`,
      [id, session.user.id],
    );

    if ((deleteResult as any).affectedRows === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: "Note deleted successfully" },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error deleting note:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
