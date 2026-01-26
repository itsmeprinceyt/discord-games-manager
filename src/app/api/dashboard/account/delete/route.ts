/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { initServer, db } from "../../../../../lib/initServer";
import { logAudit } from "../../../../../utils/Variables/AuditLogger.util";
import { AuditActor } from "../../../../../types/Admin/AuditLogger/auditLogger.type";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const botAccountId = searchParams.get("id");

    if (!botAccountId) {
      return NextResponse.json(
        { error: "Bot account ID is required" },
        { status: 400 }
      );
    }

    if (botAccountId.length !== 12) {
      return NextResponse.json(
        { error: "Invalid bot account ID format" },
        { status: 400 }
      );
    }

    await initServer();
    const pool = db();

    const [botAccount] = await pool.execute<any[]>(
      "SELECT id, name, user_id FROM bot_accounts WHERE id = ? AND user_id = ?",
      [botAccountId, session.user.id]
    );

    if (!Array.isArray(botAccount) || botAccount.length === 0) {
      return NextResponse.json(
        {
          error:
            "Bot account not found or you don't have permission to delete it",
        },
        { status: 404 }
      );
    }

    const botAccountName = botAccount[0].name;

    await pool.execute("DELETE FROM selected_bot WHERE bot_account_id = ?", [
      botAccountId,
    ]);

    const [result] = await pool.execute<any>(
      "DELETE FROM bot_accounts WHERE id = ? AND user_id = ?",
      [botAccountId, session.user.id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Failed to delete bot account" },
        { status: 500 }
      );
    }

    const actor: AuditActor = {
      user_id: session.user.id,
      email: session.user.email,
      name: session.user.username,
    };

    await logAudit(
      actor,
      "game_account_delete",
      `Bot account "${botAccountName}" deleted successfully`,
      {
        bot_account_id: botAccountId,
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Bot account deleted successfully",
        deletedId: botAccountId,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Bot account deletion error:", error);

    if (error instanceof Error) {
      if (error.message.includes("foreign key constraint fails")) {
        return NextResponse.json(
          { error: "Cannot delete bot account due to existing references" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
