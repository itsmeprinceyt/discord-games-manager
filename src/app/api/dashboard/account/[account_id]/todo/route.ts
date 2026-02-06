/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initServer, db } from "../../../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route";

export async function GET(
  request: Request,
  context: {
    params: Promise<{ account_id: string }>;
  }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const { account_id } = await context.params;
    const accountId = account_id;

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    await initServer();
    const pool = db();

    const [results] = await pool.execute<any[]>(
      `SELECT 
        ba.id,
        ba.name,
        ba.todo,
        ba.updated_at
       FROM bot_accounts ba
       WHERE ba.id = ? AND ba.user_id = ?`,
      [accountId, session.user.id]
    );

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        {
          error: "Account not found or you don't have permission to access it",
        },
        { status: 404 }
      );
    }

    const botAccount = results[0];

    return NextResponse.json(
      {
        success: true,
        data: {
          id: botAccount.id,
          name: botAccount.name,
          todo: botAccount.todo || "",
          updated_at: botAccount.updated_at,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error fetching todo:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: {
    params: Promise<{ account_id: string }>;
  }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const { account_id } = await context.params;
    const accountId = account_id;

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { todo } = body;

    // Validate todo (optional field, can be empty string)
    if (todo !== undefined && typeof todo !== "string") {
      return NextResponse.json(
        { error: "Todo must be a string" },
        { status: 400 }
      );
    }

    await initServer();
    const pool = db();

    // Update the todo for the specific bot account belonging to the user
    const updatedAt = new Date().toISOString();
    const todoValue = todo !== undefined ? todo : "";

    const [updateResult] = await pool.execute<any[]>(
      `UPDATE bot_accounts 
       SET todo = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [todoValue, updatedAt, accountId, session.user.id]
    );

    // Check if update was successful
    if ((updateResult as any).affectedRows === 0) {
      return NextResponse.json(
        { error: "Failed to update todo or account not found" },
        { status: 404 }
      );
    }

    // Get the updated bot account data
    const [updatedResults] = await pool.execute<any[]>(
      `SELECT 
        id,
        name,
        todo,
        updated_at
       FROM bot_accounts 
       WHERE id = ?`,
      [accountId]
    );

    if (!Array.isArray(updatedResults) || updatedResults.length === 0) {
      return NextResponse.json(
        { error: "Failed to retrieve updated data" },
        { status: 500 }
      );
    }

    const updatedBotAccount = updatedResults[0];

    return NextResponse.json(
      {
        success: true,
        message: "Todo updated successfully",
        data: {
          id: updatedBotAccount.id,
          name: updatedBotAccount.name,
          todo: updatedBotAccount.todo || "",
          updated_at: updatedBotAccount.updated_at,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error updating todo:", error);

    // Handle JSON parsing errors
    if (error instanceof Error) {
      if (error.message.includes("JSON")) {
        return NextResponse.json(
          { error: "Invalid request body format" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
