/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initServer, db } from "../../../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route";

// TODO: put this in a file
interface BotSelectionData {
  id: string;
  name: string;
  currency: string;
  isSelected: boolean;
  selectedBotId?: string;
  balance?: number;
}

export interface BotWithSelection {
  id: string;
  name: string;
  currency_name: string;
  selected_bot_id: string | null;
  balance: number | null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ account_id: string }> }
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
        { error: "account_id query parameter is required" },
        { status: 400 }
      );
    }

    await initServer();
    const pool = db();

    const [botsWithSelection] = await pool.execute<any[]>(
      `
      SELECT 
        b.id, 
        b.name, 
        b.currency_name,
        sb.id as selected_bot_id
      FROM bots b
      LEFT JOIN selected_bot sb 
        ON b.name = sb.name 
        AND sb.bot_account_id = ?
      ORDER BY b.name ASC
    `,
      [accountId]
    );

    if (!Array.isArray(botsWithSelection)) {
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    const botSelectionData: BotSelectionData[] = botsWithSelection.map(
      (bot) => ({
        id: bot.id,
        name: bot.name,
        currency: bot.currency_name,
        isSelected: !!bot.selected_bot_id,
        selectedBotId: bot.selected_bot_id || undefined,
      })
    );

    const selectedCount = botSelectionData.filter(
      (bot) => bot.isSelected
    ).length;

    return NextResponse.json(
      {
        success: true,
        data: botSelectionData,
        meta: {
          total: botSelectionData.length,
          selected: selectedCount,
          accountId,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error fetching bots for selection:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
