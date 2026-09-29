/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { isUserBanned } from "../../../../utils/Variables/getUserBanned";
import { authOptions } from "../../auth/[...nextauth]/route";
import { db, initServer } from "../../../../lib/initServer";

/** Convert a stored date string into a comparable timestamp. */
function toTs(iso: string | null): number {
  if (!iso) return NaN;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? NaN : t;
}

/** Normalise a nullable timestamp to a sortable number (-Infinity for null/invalid). */
function safeTs(iso: string | null): number {
  const t = toTs(iso);
  return Number.isNaN(t) ? -Infinity : t;
}

export async function GET(request: Request) {
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

    const url = new URL(request.url);
    const botsParam = url.searchParams.get("bots");
    const minBalanceParam = url.searchParams.get("min_balance");

    // `bots` absent  → no filter, all bots are considered selected
    // `bots=` empty  → explicit empty selection, nothing matches
    let botFilter: Set<string> | null = null;
    if (botsParam !== null) {
      botFilter = new Set(
        botsParam
          .split(",")
          .map((b) => b.trim())
          .filter(Boolean),
      );
    }

    let minBalance: number | null = null;
    if (minBalanceParam !== null && minBalanceParam.trim() !== "") {
      const n = Number(minBalanceParam);
      if (Number.isFinite(n) && n >= 0) minBalance = n;
    }

    await initServer();
    const pool = db();

    // One row per (selected_bot, account). Blacklisted bots are excluded up
    // front — we never want to surface them as suggestions.
    //
    // Regular crosstrades are aggregated live from the `crosstrades` table
    // via MAX(crosstrade_date) so the cached `sb.last_crosstraded_at` column
    // (which is also touched by the currency flow) can't contaminate the
    // regular-trade view.
    //
    // Currency crosstrades are read straight from the cached column
    // `sb.last_currency_crosstraded_at`. Swap in a similar derived-table
    // join against your currency crosstrades table if you want them live too.
    const [rows] = await pool.execute<any[]>(
      `SELECT
         sb.id                            AS selected_bot_id,
         sb.bot_account_id                AS bot_account_id,
         sb.name                          AS bot_name,
         sb.currency_name                 AS currency_name,
         sb.balance                       AS balance,
         sb.blacklisted                   AS blacklisted,
         sb.normal_days                   AS normal_days,
         sb.weekend_days                  AS weekend_days,
         sb.last_currency_crosstraded_at  AS last_currency_crosstraded_at,
         sb.voted_at                      AS voted_at,
         sb.updated_at                    AS updated_at,
         ba.name                          AS account_name,
         ba.account_uid                   AS account_uid,
         ba.created_at                    AS account_created_at,
         ct_max.last_crosstrade_date      AS last_crosstraded_at
       FROM selected_bot sb
       INNER JOIN bot_accounts ba ON ba.id = sb.bot_account_id
       LEFT JOIN (
         SELECT
           selected_bot_id,
           bot_account_id,
           MAX(crosstrade_date) AS last_crosstrade_date
         FROM crosstrades
         GROUP BY selected_bot_id, bot_account_id
       ) ct_max
         ON ct_max.selected_bot_id = sb.id
        AND ct_max.bot_account_id = sb.bot_account_id
       WHERE ba.user_id = ? AND sb.blacklisted = 0`,
      [session.user.id],
    );

    // Unique bot names for the filter pills (alphabetical for stable UI)
    const availableBots = Array.from(
      new Set(rows.map((r) => r.bot_name as string)),
    ).sort((a, b) => a.localeCompare(b));

    // Group filtered rows by account
    type AccountBucket = {
      account_id: string;
      account_name: string;
      account_uid: string | null;
      account_created_at: string;
      last_traded_at: string | null;
      last_currency_traded_at: string | null;
      _lastTradeTs: number;
      _lastCurrencyTradeTs: number;
      _totalBalance: number;
      bots: any[];
    };

    const accountMap = new Map<string, AccountBucket>();

    for (const row of rows) {
      if (botFilter !== null && !botFilter.has(row.bot_name)) continue;
      if (
        minBalance !== null &&
        (row.balance === null || Number(row.balance) < minBalance)
      ) {
        continue;
      }

      let bucket = accountMap.get(row.bot_account_id);
      if (!bucket) {
        bucket = {
          account_id: row.bot_account_id,
          account_name: row.account_name,
          account_uid: row.account_uid,
          account_created_at: row.account_created_at,
          last_traded_at: null,
          last_currency_traded_at: null,
          _lastTradeTs: -Infinity,
          _lastCurrencyTradeTs: -Infinity,
          _totalBalance: 0,
          bots: [],
        };
        accountMap.set(row.bot_account_id, bucket);
      }

      const botBalance = Number(row.balance ?? 0);

      bucket.bots.push({
        selected_bot_id: row.selected_bot_id,
        name: row.bot_name,
        currency_name: row.currency_name,
        balance: botBalance,
        blacklisted: Boolean(row.blacklisted),
        normal_days: row.normal_days,
        weekend_days: row.weekend_days,
        last_crosstraded_at: row.last_crosstraded_at,
        last_currency_crosstraded_at: row.last_currency_crosstraded_at,
        voted_at: row.voted_at,
        updated_at: row.updated_at,
      });

      bucket._totalBalance += botBalance;

      const ts = safeTs(row.last_crosstraded_at);
      if (ts > bucket._lastTradeTs) {
        bucket._lastTradeTs = ts;
        bucket.last_traded_at = row.last_crosstraded_at;
      }

      const cts = safeTs(row.last_currency_crosstraded_at);
      if (cts > bucket._lastCurrencyTradeTs) {
        bucket._lastCurrencyTradeTs = cts;
        bucket.last_currency_traded_at = row.last_currency_crosstraded_at;
      }
    }

    // Default server sort (the frontend re-sorts client-side based on the
    // user's chosen criterion):
    //   1) oldest regular crosstrade first
    //   2) then oldest currency crosstrade
    //   3) then highest total balance
    //   4) then account name asc, for deterministic ordering
    const accounts = Array.from(accountMap.values()).sort((a, b) => {
      if (a._lastTradeTs !== b._lastTradeTs) {
        return a._lastTradeTs - b._lastTradeTs;
      }
      if (a._lastCurrencyTradeTs !== b._lastCurrencyTradeTs) {
        return a._lastCurrencyTradeTs - b._lastCurrencyTradeTs;
      }
      if (a._totalBalance !== b._totalBalance) {
        return b._totalBalance - a._totalBalance;
      }
      return a.account_name.localeCompare(b.account_name);
    });

    // Clean up + sort bots inside each account by the same criteria.
    const cleanAccounts = accounts.map((a) => {
      const bots = [...a.bots].sort((x, y) => {
        const xt = safeTs(x.last_crosstraded_at);
        const yt = safeTs(y.last_crosstraded_at);
        if (xt !== yt) return xt - yt;

        const xct = safeTs(x.last_currency_crosstraded_at);
        const yct = safeTs(y.last_currency_crosstraded_at);
        if (xct !== yct) return xct - yct;

        if (x.balance !== y.balance) return y.balance - x.balance;
        return (x.name as string).localeCompare(y.name as string);
      });

      return {
        account_id: a.account_id,
        account_name: a.account_name,
        account_uid: a.account_uid,
        account_created_at: a.account_created_at,
        last_traded_at: a.last_traded_at,
        last_currency_traded_at: a.last_currency_traded_at,
        total_balance: a._totalBalance,
        bots,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          available_bots: availableBots,
          accounts: cleanAccounts,
        },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error fetching suggestions:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
