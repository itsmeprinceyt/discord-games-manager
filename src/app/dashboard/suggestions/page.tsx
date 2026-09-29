"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Loader2,
  Coins,
  Filter,
  AlertTriangle,
  Clock,
  RefreshCw,
  X,
} from "lucide-react";
import PageWrapper from "../../(components)/PageWrapper";
import Loader from "../../(components)/Loader";
import CountdownTimer from "../../(components)/CountdownTimer";
import { formatDate, formatDateTime } from "../../../utils/main.util";
import { BLUE_Button, STONE_Button } from "../../../utils/CSS/Button.util";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface SuggestionBot {
  selected_bot_id: string;
  name: string;
  currency_name: string;
  balance: number;
  blacklisted: boolean;
  normal_days: number;
  weekend_days: number;
  last_crosstraded_at: string | null;
  last_currency_crosstraded_at: string | null;
  voted_at: string | null;
  updated_at: string;
}

interface SuggestionAccount {
  account_id: string;
  account_name: string;
  account_uid: string | null;
  account_created_at: string;
  last_traded_at: string | null;
  last_currency_traded_at: string | null;
  total_balance: number;
  bots: SuggestionBot[];
}

interface ApiResponse {
  success: boolean;
  data: {
    available_bots: string[];
    accounts: SuggestionAccount[];
  };
}

type SortBy = "crosstrade" | "currency_crosstrade" | "balance";

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "crosstrade", label: "Crosstrades" },
  { value: "currency_crosstrade", label: "Currency Crosstrades" },
  { value: "balance", label: "Balance" },
];

const DEFAULT_SORT: SortBy = "crosstrade";

/* ------------------------------------------------------------------ */
/* localStorage helpers — SSR-safe                                     */
/* ------------------------------------------------------------------ */

const LS_KEYS = {
  selectedBot: "games_manager_pro:suggestions:selectedBot",
  minBalance: "games_manager_pro:suggestions:minBalance",
  sortBy: "games_manager_pro:suggestions:sortBy",
  showFilters: "games_manager_pro:suggestions:showFilters",
} as const;

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLS(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — silently ignore */
  }
}

function removeLS(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function safeTs(iso: string | null): number {
  if (!iso) return -Infinity;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? -Infinity : t;
}

/** Colour for the "last traded" text — green = safest, red = just traded. */
function tradeAgeColor(iso: string | null): string {
  if (!iso) return "text-stone-500";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "text-stone-500";
  const days = (Date.now() - t) / (1000 * 60 * 60 * 24);
  if (days < 1) return "text-red-400";
  if (days < 3) return "text-amber-400";
  if (days < 7) return "text-yellow-300";
  return "text-green-400";
}

/**
 * 0 or 1  → singular (e.g. "1 INR", "0 USD")
 * 2+      → plural   (e.g. "5 INRs", "200 USDs")
 */
function pluralizeCurrency(amount: number, currency: string): string {
  return `${currency}${amount > 1 ? "s" : ""}`;
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

function EmptyState({
  icon: Icon,
  title,
  message,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <Icon className="h-10 w-10 text-stone-600" />
      <p className="text-stone-200 text-base font-medium">{title}</p>
      <p className="text-stone-500 text-sm">{message}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Trade cell — reused for both crosstrade columns                     */
/* ------------------------------------------------------------------ */

function TradeCell({ iso }: { iso: string | null }) {
  const absolute = iso ? formatDateTime(iso) : "";
  const dayOnly = iso ? formatDate(iso) : "";

  return (
    <div className="flex items-center gap-2">
      <Clock className="h-4 w-4 text-stone-500 shrink-0" />
      <div className="min-w-0">
        <div className="text-base leading-tight">
          <CountdownTimer startDate={iso} />
        </div>
        <p
          className={`text-sm truncate mt-0.5 ${tradeAgeColor(iso)}`}
          title={absolute || "Never"}
        >
          {iso ? `${absolute} (${dayOnly})` : "Never"}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Account table row                                                   */
/* ------------------------------------------------------------------ */

function AccountRow({
  account,
  rank,
}: {
  account: SuggestionAccount;
  rank: number;
}) {
  const isTop = rank === 1;

  const currencies = Array.from(
    new Set(account.bots.map((b) => b.currency_name)),
  );

  return (
    <tr
      className={`border-t border-stone-800 hover:bg-stone-900/30 transition-colors ${
        isTop ? "bg-amber-500/4" : ""
      }`}
    >
      {/* # */}
      <td className="p-4 whitespace-nowrap">
        <span
          className={`font-mono text-base tabular-nums ${
            isTop ? "text-amber-300 font-medium" : "text-stone-300"
          }`}
        >
          #{rank}
        </span>
      </td>

      {/* ACCOUNT */}
      <td className="p-4">
        <div className="min-w-0">
          <Link
            href={`/dashboard/accounts/${account.account_id}/`}
            className="text-white font-medium text-base leading-tight truncate hover:text-blue-400 transition-colors inline-block max-w-60"
            title={account.account_name}
          >
            {account.account_name}
          </Link>
          <p
            className="text-stone-500 text-sm mt-0.5 font-mono truncate max-w-55"
            title={account.account_uid || "No UID"}
          >
            {account.account_uid || "No UID"}
          </p>
        </div>
      </td>

      {/* BALANCE */}
      <td className="p-4 whitespace-nowrap">
        <p className="text-green-400 font-medium text-base tabular-nums">
          {account.total_balance.toLocaleString()}
          {currencies.length > 0 && (
            <span className="text-stone-500 font-normal text-sm ml-1.5">
              {currencies
                .map((c) => pluralizeCurrency(account.total_balance, c))
                .join(" / ")}
            </span>
          )}
        </p>
      </td>

      {/* CROSSTRADES */}
      <td className="p-4 whitespace-nowrap">
        <TradeCell iso={account.last_traded_at} />
      </td>

      {/* CURRENCY CROSSTRADES */}
      <td className="p-4 whitespace-nowrap">
        <TradeCell iso={account.last_currency_traded_at} />
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function SuggestionsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [availableBots, setAvailableBots] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<SuggestionAccount[]>([]);
  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const [minBalance, setMinBalance] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>(DEFAULT_SORT);
  const [showFilters, setShowFilters] = useState(false);

  const initialFetchedRef = useRef(false);
  const lastFetchKeyRef = useRef<string>("");
  // Gate writes behind hydration so we never overwrite stored values with
  // the initial-state defaults on the very first render.
  const hydratedRef = useRef(false);

  /* --------------------------------------------------------------- */
  /* Fetch                                                           */
  /* --------------------------------------------------------------- */

  const fetchSuggestions = useCallback(
    async (bot: string | null, bal: string, isInitial: boolean) => {
      const key = `${bot ?? "__all__"}|${bal.trim()}`;
      if (!isInitial && lastFetchKeyRef.current === key) return;
      lastFetchKeyRef.current = key;

      if (isInitial) setLoading(true);
      else setRefreshing(true);

      try {
        const params = new URLSearchParams();
        if (bot !== null) params.set("bots", bot);
        if (bal.trim() !== "") params.set("min_balance", bal.trim());

        const res = await axios.get<ApiResponse>(
          `/api/dashboard/suggestions?${params.toString()}`,
        );

        if (res.data.success) {
          setAvailableBots(res.data.data.available_bots);
          setAccounts(res.data.data.accounts);
        }
      } catch (err) {
        toast.error("Failed to load suggestions");
        console.error(err);
      } finally {
        if (isInitial) setLoading(false);
        else setRefreshing(false);
      }
    },
    [],
  );

  /* --------------------------------------------------------------- */
  /* Hydrate from localStorage, then initial fetch                   */
  /*                                                                 */
  /* All setState calls live inside the async IIFE so they run       */
  /* after an await — that keeps them out of the synchronous effect  */
  /* body and satisfies react-hooks/set-state-in-effect.             */
  /* --------------------------------------------------------------- */

  useEffect(() => {
    (async () => {
      try {
        // 1. Read persisted settings synchronously (external system).
        const storedBot = readLS<string | null>(LS_KEYS.selectedBot, null);
        const storedMinBalance = readLS<string>(LS_KEYS.minBalance, "");
        const storedSortBy = readLS<SortBy>(LS_KEYS.sortBy, DEFAULT_SORT);
        const storedShowFilters = readLS<boolean>(LS_KEYS.showFilters, false);

        // 2. Fetch initial data (no filters) to learn available bots.
        const res = await axios.get<ApiResponse>("/api/dashboard/suggestions");

        if (res.data.success) {
          const bots = res.data.data.available_bots;
          const safeSortBy = SORT_OPTIONS.some((o) => o.value === storedSortBy)
            ? storedSortBy
            : DEFAULT_SORT;

          // Prefer the stored bot if it still exists; otherwise fall back
          // to the first bot, or null when there are none.
          let nextBot: string | null = null;
          if (storedBot && bots.includes(storedBot)) nextBot = storedBot;
          else if (bots.length > 0) nextBot = bots[0];

          // Batched commit — single re-render for all initial state.
          setAvailableBots(bots);
          setAccounts(res.data.data.accounts);
          setSelectedBot(nextBot);
          setMinBalance(storedMinBalance);
          setSortBy(safeSortBy);
          setShowFilters(storedShowFilters);
        }
      } catch (err) {
        toast.error("Failed to load suggestions");
        console.error(err);
      } finally {
        setLoading(false);
        initialFetchedRef.current = true;
        hydratedRef.current = true;
      }
    })();
  }, []);

  /* --------------------------------------------------------------- */
  /* Persist settings → localStorage (only after hydration)          */
  /* --------------------------------------------------------------- */

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (selectedBot === null) removeLS(LS_KEYS.selectedBot);
    else writeLS(LS_KEYS.selectedBot, selectedBot);
  }, [selectedBot]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    writeLS(LS_KEYS.minBalance, minBalance);
  }, [minBalance]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    writeLS(LS_KEYS.sortBy, sortBy);
  }, [sortBy]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    writeLS(LS_KEYS.showFilters, showFilters);
  }, [showFilters]);

  /* --------------------------------------------------------------- */
  /* Refetch when the selected bot / min balance changes (debounced) */
  /* --------------------------------------------------------------- */

  useEffect(() => {
    if (!initialFetchedRef.current) return;

    const t = setTimeout(() => {
      fetchSuggestions(selectedBot, minBalance, false);
    }, 350);

    return () => clearTimeout(t);
  }, [selectedBot, minBalance, fetchSuggestions]);

  /* --------------------------------------------------------------- */
  /* Client-side sort — instant, no refetch                          */
  /* --------------------------------------------------------------- */

  const sortedAccounts = useMemo(() => {
    const arr = [...accounts];

    if (sortBy === "balance") {
      arr.sort((a, b) => {
        if (b.total_balance !== a.total_balance) {
          return b.total_balance - a.total_balance;
        }
        return a.account_name.localeCompare(b.account_name);
      });
    } else if (sortBy === "crosstrade") {
      arr.sort((a, b) => {
        const at = safeTs(a.last_traded_at);
        const bt = safeTs(b.last_traded_at);
        if (at !== bt) return at - bt;

        const act = safeTs(a.last_currency_traded_at);
        const bct = safeTs(b.last_currency_traded_at);
        if (act !== bct) return act - bct;

        if (b.total_balance !== a.total_balance) {
          return b.total_balance - a.total_balance;
        }
        return a.account_name.localeCompare(b.account_name);
      });
    } else {
      // currency_crosstrade
      arr.sort((a, b) => {
        const at = safeTs(a.last_currency_traded_at);
        const bt = safeTs(b.last_currency_traded_at);
        if (at !== bt) return at - bt;

        const act = safeTs(a.last_traded_at);
        const bct = safeTs(b.last_traded_at);
        if (act !== bct) return act - bct;

        if (b.total_balance !== a.total_balance) {
          return b.total_balance - a.total_balance;
        }
        return a.account_name.localeCompare(b.account_name);
      });
    }

    return arr;
  }, [accounts, sortBy]);

  /* --------------------------------------------------------------- */
  /* Handlers                                                        */
  /* --------------------------------------------------------------- */

  const handleRefresh = () => {
    // Force a real refetch by clearing the de-dupe key, then call with
    // the current bot + balance and non-initial flag so the spinner
    // doesn't nuke the whole page.
    lastFetchKeyRef.current = "";
    fetchSuggestions(selectedBot, minBalance, false);
  };

  const clearFilters = () => {
    setSelectedBot(null);
    setMinBalance("");
    setSortBy(DEFAULT_SORT);
  };

  // "Active filters" = anything narrowing the current dataset. `sortBy` is
  // a view preference, not a filter, so it doesn't count here.
  const hasActiveFilters = selectedBot !== null || minBalance.trim() !== "";

  /* --------------------------------------------------------------- */
  /* Render                                                          */
  /* --------------------------------------------------------------- */

  return (
    <PageWrapper withSidebar sidebarRole="user">
      <div className="min-h-screen p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-medium text-white mb-2">
                Suggestions
              </h1>
              <p className="text-stone-400 text-sm">
                A quick overview of your accounts and their bots. Filter by bot
                or minimum balance, and sort by whichever column matters to you.
              </p>
            </div>

            <div className="flex justify-end flex-wrap gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 ${STONE_Button} text-stone-300 rounded-lg text-sm transition-colors cursor-pointer flex items-center gap-2`}
              >
                <Filter className="h-4 w-4" />
                Filters {showFilters ? "(Hide)" : ""}
                {hasActiveFilters && (
                  <div className="w-2 h-2 bg-green-400 rounded-full shadow-md shadow-green-400/50" />
                )}
              </button>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`px-4 py-2 ${STONE_Button} text-stone-300 rounded-lg text-sm transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 bg-stone-950 border border-stone-800 rounded-xl px-4">
            <div className="flex items-center justify-between my-4">
              <h3 className="text-lg font-medium text-stone-400">
                Filter Suggestions
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={clearFilters}
                  className={`px-3 py-1.5 ${STONE_Button} text-stone-300 text-sm rounded cursor-pointer`}
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-stone-400 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 my-4">
              {/* Bot */}
              <div>
                <label className="block text-sm text-stone-400 mb-1">Bot</label>
                <select
                  value={selectedBot ?? ""}
                  onChange={(e) =>
                    setSelectedBot(
                      e.target.value === "" ? null : e.target.value,
                    )
                  }
                  disabled={availableBots.length === 0}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-white text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {availableBots.length === 0
                      ? "No bots available"
                      : "No bot selected"}
                  </option>
                  {availableBots.map((bot) => (
                    <option key={bot} value={bot}>
                      {bot}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort by */}
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  Sort by
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-white text-sm cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min balance */}
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  Minimum Balance (optional)
                </label>
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500 pointer-events-none" />
                  <input
                    type="number"
                    min={0}
                    value={minBalance}
                    onChange={(e) => setMinBalance(e.target.value)}
                    placeholder="e.g. 200"
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder-stone-600 focus:outline-none focus:border-stone-600"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <Loader />
        ) : selectedBot === null ? (
          <EmptyState
            icon={Filter}
            title="No bot selected"
            message="Pick a bot above to see suggestions."
          />
        ) : sortedAccounts.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No matching accounts"
            message="Try lowering the minimum balance or picking a different bot."
          />
        ) : (
          <div className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden select-text">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-800">
                    <th className="text-left p-4 text-stone-400 text-base font-medium whitespace-nowrap">
                      #
                    </th>
                    <th className="text-left p-4 text-stone-400 text-base font-medium whitespace-nowrap">
                      ACCOUNT
                    </th>
                    <th className="text-left p-4 text-stone-400 text-base font-medium whitespace-nowrap">
                      BALANCE
                    </th>
                    <th className="text-left p-4 text-stone-400 text-base font-medium whitespace-nowrap">
                      CROSSTRADES
                    </th>
                    <th className="text-left p-4 text-stone-400 text-base font-medium whitespace-nowrap">
                      CURRENCY CROSSTRADES
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAccounts.map((acc, idx) => (
                    <AccountRow
                      key={acc.account_id}
                      account={acc}
                      rank={idx + 1}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
