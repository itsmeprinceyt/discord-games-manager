/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { initServer, db } from "../../../../lib/initServer";
import { getCurrentDateTime } from "../../../../utils/Variables/getDateTime.util";
import { generateHexId } from "../../../../utils/Variables/generateHexID.util";
import { logAudit } from "../../../../utils/Variables/AuditLogger.util";
import { AuditActor } from "../../../../types/Admin/AuditLogger/auditLogger.type";
import { BotFormData } from "../../../../types/Admin/BotManager/BotManager.type";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// TODO: put this in a file
interface Bot {
  id: string;
  name: string;
  currency_name: string;
  vote_link: string | null;
  normal_days: number;
  weekend_days: number;
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

    if (!session.user.is_admin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    await initServer();
    const pool = db();

    const [bots] = await pool.execute<any[]>(`
      SELECT 
        id, 
        name, 
        currency_name, 
        vote_link, 
        vote_link_alternate,
        normal_days, 
        weekend_days, 
        created_at, 
        updated_at
      FROM bots 
      ORDER BY created_at DESC
    `);

    if (!Array.isArray(bots)) {
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    const botData: Bot[] = bots.map((bot) => ({
      id: bot.id,
      name: bot.name,
      currency_name: bot.currency_name,
      vote_link: bot.vote_link,
      vote_link_alternate: bot.vote_link_alternate,
      normal_days: Number(bot.normal_days),
      weekend_days: Number(bot.weekend_days),
      created_at: bot.created_at,
      updated_at: bot.updated_at,
    }));

    return NextResponse.json(
      {
        success: true,
        data: botData,
        count: botData.length,
        meta: {
          total: botData.length,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error fetching bots for admin:", error);

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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    if (!session.user.is_admin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      currency_name,
      vote_link,
      vote_link_alternate,
      normal_days,
      weekend_days,
    } = body as BotFormData;

    if (
      !name ||
      !currency_name ||
      !vote_link ||
      normal_days === undefined ||
      weekend_days === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Required fields: name, currency_name, vote_link, normal_days, weekend_days",
        },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const trimmedCurrencyName = currency_name.trim();
    const trimmedVoteLink = vote_link.trim();
    const trimmedVoteLinkAlternate = vote_link_alternate
      ? vote_link_alternate.trim()
      : "";

    if (!trimmedName || !trimmedCurrencyName || !trimmedVoteLink) {
      return NextResponse.json(
        { error: "Bot name, currency name, and vote link are required" },
        { status: 400 }
      );
    }

    if (trimmedName.length > 30) {
      return NextResponse.json(
        { error: "Bot name must be 30 characters or less" },
        { status: 400 }
      );
    }

    if (trimmedCurrencyName.length > 30) {
      return NextResponse.json(
        { error: "Currency name must be 30 characters or less" },
        { status: 400 }
      );
    }

    try {
      new URL(trimmedVoteLink);
    } catch {
      return NextResponse.json(
        { error: "Invalid vote link URL format" },
        { status: 400 }
      );
    }

    if (trimmedVoteLink.length > 100) {
      return NextResponse.json(
        { error: "Vote link must be 100 characters or less" },
        { status: 400 }
      );
    }

    if (trimmedVoteLinkAlternate) {
      try {
        new URL(trimmedVoteLinkAlternate);
      } catch {
        return NextResponse.json(
          { error: "Invalid alternate vote link URL format" },
          { status: 400 }
        );
      }
      if (trimmedVoteLinkAlternate.length > 100) {
        return NextResponse.json(
          { error: "Alternate vote link must be 100 characters or less" },
          { status: 400 }
        );
      }
    }

    if (normal_days < 1 || normal_days > 30) {
      return NextResponse.json(
        { error: "Normal days must be between 1 and 30" },
        { status: 400 }
      );
    }

    if (weekend_days < 0 || weekend_days > 7) {
      return NextResponse.json(
        { error: "Weekend days must be between 0 and 7" },
        { status: 400 }
      );
    }

    await initServer();
    const pool = db();
    const now = getCurrentDateTime();

    const [existingBots] = await pool.execute<any[]>(
      "SELECT id FROM bots WHERE name = ?",
      [trimmedName]
    );

    if (Array.isArray(existingBots) && existingBots.length > 0) {
      return NextResponse.json(
        { error: "A bot with this name already exists" },
        { status: 409 }
      );
    }

    const [existingVoteLinks] = await pool.execute<any[]>(
      "SELECT id FROM bots WHERE vote_link = ?",
      [trimmedVoteLink]
    );

    if (Array.isArray(existingVoteLinks) && existingVoteLinks.length > 0) {
      return NextResponse.json(
        { error: "A bot with this vote link already exists" },
        { status: 409 }
      );
    }

    if (trimmedVoteLinkAlternate) {
      const [existingAlternateVoteLinks] = await pool.execute<any[]>(
        "SELECT id FROM bots WHERE vote_link_alternate = ?",
        [trimmedVoteLinkAlternate]
      );

      if (
        Array.isArray(existingAlternateVoteLinks) &&
        existingAlternateVoteLinks.length > 0
      ) {
        return NextResponse.json(
          { error: "A bot with this alternate vote link already exists" },
          { status: 409 }
        );
      }
    }

    const id = generateHexId(12);

    await pool.execute(
      "INSERT INTO bots (id, name, currency_name, vote_link, vote_link_alternate, normal_days, weekend_days, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        trimmedName,
        trimmedCurrencyName,
        trimmedVoteLink,
        trimmedVoteLinkAlternate || null,
        normal_days,
        weekend_days,
        now,
        now,
      ]
    );

    const actor: AuditActor = {
      user_id: session.user.id,
      email: session.user.email,
      name: session.user.username,
    };

    await logAudit(
      actor,
      "admin_action",
      `Bot "${trimmedName}" created successfully`,
      {
        bot_id: id,
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Bot created successfully",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Bot creation error:", error);

    if (error instanceof Error) {
      if (error.message.includes("Duplicate entry")) {
        return NextResponse.json(
          { error: "Bot with this name or vote link already exists" },
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
