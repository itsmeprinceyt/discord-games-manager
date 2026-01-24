/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initServer, db } from "../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// TODO: put in a file
interface BotAccountResponse {
  id: string;
  name: string;
  account_uid: string | null;
  created_at: string;
  updated_at: string;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    await initServer();
    const pool = db();

    const [botAccounts] = await pool.execute<any[]>(
      "SELECT id, name, account_uid, created_at, updated_at FROM bot_accounts WHERE user_id = ? ORDER BY name ASC",
      [session.user.id]
    );

    const formattedAccounts: BotAccountResponse[] = Array.isArray(botAccounts)
      ? botAccounts.map((account) => ({
          id: account.id,
          name: account.name,
          account_uid: account.account_uid,
          created_at: account.created_at,
          updated_at: account.updated_at,
        }))
      : [];

    return NextResponse.json(
      {
        success: true,
        data: formattedAccounts,
        count: formattedAccounts.length,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error fetching bot accounts:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
