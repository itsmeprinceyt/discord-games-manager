"use client";
import React from "react";
import { useState, useEffect, useCallback } from "react";
import PageWrapper from "../../(components)/PageWrapper";
import Link from "next/link";
import {
  RefreshCw,
  ArrowRightLeft,
  User,
  ChevronDown,
  ChevronUp,
  Loader2,
  Link as LinkIcon,
  Filter,
  X,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import getAxiosErrorMessage from "../../../utils/Variables/getAxiosError.util";
import { formatDateTime } from "../../../utils/main.util";
import { BLUE_Button, STONE_Button } from "../../../utils/CSS/Button.util";
import Loader from "../../(components)/Loader";
import { UserCurrencyCrossTradesResponse } from "../../api/dashboard/currency-crosstrade-logs/route";

interface Filters {
  from_bot_account_id: string;
  to_bot_account_id: string;
  from_currency_name: string;
  to_currency_name: string;
  from_bot_name: string;
  to_bot_name: string;
  start_date: string;
  end_date: string;
  page: number;
  limit: number;
}

export default function CurrencyCrossTradeLogsPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [data, setData] = useState<UserCurrencyCrossTradesResponse | null>(
    null
  );
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const [filters, setFilters] = useState<Filters>({
    from_bot_account_id: "",
    to_bot_account_id: "",
    from_currency_name: "",
    to_currency_name: "",
    from_bot_name: "",
    to_bot_name: "",
    start_date: "",
    end_date: "",
    page: 1,
    limit: 20,
  });

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.from_bot_account_id)
      params.append("from_bot_account_id", filters.from_bot_account_id);
    if (filters.to_bot_account_id)
      params.append("to_bot_account_id", filters.to_bot_account_id);
    if (filters.from_currency_name)
      params.append("from_currency_name", filters.from_currency_name);
    if (filters.to_currency_name)
      params.append("to_currency_name", filters.to_currency_name);
    if (filters.from_bot_name)
      params.append("from_bot_name", filters.from_bot_name);
    if (filters.to_bot_name) params.append("to_bot_name", filters.to_bot_name);
    if (filters.start_date) params.append("start_date", filters.start_date);
    if (filters.end_date) params.append("end_date", filters.end_date);
    params.append("page", filters.page.toString());
    params.append("limit", filters.limit.toString());
    return params.toString();
  }, [filters]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const queryString = buildQueryString();
      const response = await axios.get(
        `/api/dashboard/currency-crosstrade-logs?${queryString}`
      );
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error: unknown) {
      toast.error(
        getAxiosErrorMessage(error, "Failed to load currency crosstrade data")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [buildQueryString]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const clearFilters = () => {
    setFilters({
      from_bot_account_id: "",
      to_bot_account_id: "",
      from_currency_name: "",
      to_currency_name: "",
      from_bot_name: "",
      to_bot_name: "",
      start_date: "",
      end_date: "",
      page: 1,
      limit: 20,
    });
  };

  const toggleExpand = (tradeId: string) => {
    setExpandedTradeId(expandedTradeId === tradeId ? null : tradeId);
  };

  const hasActiveFilters = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { page, limit, ...filterValues } = filters;
    return Object.values(filterValues).some((v) => v !== "");
  };

  const selectClass =
    "w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-white text-sm cursor-pointer";

  return (
    <PageWrapper withSidebar sidebarRole="user">
      <div className="min-h-screen p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-medium text-white mb-2">
                Currency Crosstrade Logs
              </h1>
              <p className="text-stone-400 text-sm">
                View all in-game currency exchanges at one place!
              </p>
            </div>

            <div className="flex justify-end flex-wrap gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 ${STONE_Button} text-stone-300 rounded-lg text-sm transition-colors cursor-pointer flex items-center gap-2`}
              >
                <Filter className="h-4 w-4" />
                Filters {showFilters ? "(Hide)" : ""}
                {hasActiveFilters() && (
                  <div className="w-2 h-2 bg-green-400 rounded-full shadow-md shadow-green-400/50" />
                )}
              </button>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`px-4 py-2 ${STONE_Button} text-stone-300 rounded-lg text-sm transition-colors cursor-pointer flex items-center gap-2`}
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
                Filter Trades
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
              {/* From Bot Account */}
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  From Account
                </label>
                <select
                  value={filters.from_bot_account_id}
                  onChange={(e) =>
                    handleFilterChange("from_bot_account_id", e.target.value)
                  }
                  className={selectClass}
                >
                  <option value="">All Accounts</option>
                  {data?.filters?.bot_accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* To Bot Account */}
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  To Account
                </label>
                <select
                  value={filters.to_bot_account_id}
                  onChange={(e) =>
                    handleFilterChange("to_bot_account_id", e.target.value)
                  }
                  className={selectClass}
                >
                  <option value="">All Accounts</option>
                  {data?.filters?.bot_accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* From Bot Name */}
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  From Bot
                </label>
                <select
                  value={filters.from_bot_name}
                  onChange={(e) =>
                    handleFilterChange("from_bot_name", e.target.value)
                  }
                  className={selectClass}
                >
                  <option value="">All Bots</option>
                  {data?.filters?.from_bot_names.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* To Bot Name */}
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  To Bot
                </label>
                <select
                  value={filters.to_bot_name}
                  onChange={(e) =>
                    handleFilterChange("to_bot_name", e.target.value)
                  }
                  className={selectClass}
                >
                  <option value="">All Bots</option>
                  {data?.filters?.to_bot_names.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* From Currency */}
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  Giving Currency
                </label>
                <select
                  value={filters.from_currency_name}
                  onChange={(e) =>
                    handleFilterChange("from_currency_name", e.target.value)
                  }
                  className={selectClass}
                >
                  <option value="">All Currencies</option>
                  {data?.filters?.from_currencies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* To Currency */}
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  Receiving Currency
                </label>
                <select
                  value={filters.to_currency_name}
                  onChange={(e) =>
                    handleFilterChange("to_currency_name", e.target.value)
                  }
                  className={selectClass}
                >
                  <option value="">All Currencies</option>
                  {data?.filters?.to_currencies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) =>
                    handleFilterChange("start_date", e.target.value)
                  }
                  className={selectClass}
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) =>
                    handleFilterChange("end_date", e.target.value)
                  }
                  className={selectClass}
                />
              </div>

              {/* Items per page */}
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  Items per Page
                </label>
                <select
                  value={filters.limit}
                  onChange={(e) => handleFilterChange("limit", e.target.value)}
                  className={selectClass}
                >
                  <option value="10">10 per page</option>
                  <option value="20">20 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <Loader text="Loading currency crosstrade data..." />
        ) : (
          <>
            {/* Empty State */}
            {data?.currency_crosstrade_logs.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-stone-700 rounded-lg">
                <ArrowRightLeft className="h-12 w-12 text-stone-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-stone-300 mb-2">
                  No currency crosstrades found
                </h3>
                <p className="text-stone-500 max-w-md mx-auto mb-6">
                  Start by creating your first currency crosstrade or adjust
                  your filters.
                </p>
                {hasActiveFilters() && (
                  <button
                    onClick={clearFilters}
                    className={`px-4 py-2 ${STONE_Button} text-stone-300 rounded-lg text-sm transition-colors cursor-pointer`}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Results count + top pagination */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-stone-400 text-sm">
                    Showing {(filters.page - 1) * filters.limit + 1} to{" "}
                    {Math.min(
                      filters.page * filters.limit,
                      data?.total_count || 0
                    )}{" "}
                    of {data?.total_count} trades
                  </div>

                  {data && data.total_pages > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(filters.page - 1)}
                        disabled={filters.page <= 1}
                        className={`px-3 py-1.5 ${STONE_Button} text-stone-300 text-sm rounded cursor-pointer ${
                          filters.page <= 1
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        Previous
                      </button>
                      <span className="text-white text-sm px-2">
                        Page {filters.page} of {data.total_pages}
                      </span>
                      <button
                        onClick={() => handlePageChange(filters.page + 1)}
                        disabled={filters.page >= data.total_pages}
                        className={`px-3 py-1.5 ${STONE_Button} text-stone-300 text-sm rounded cursor-pointer ${
                          filters.page >= data.total_pages
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>

                {/* Table */}
                <div className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden select-text">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-stone-800">
                          <th className="text-left p-4 text-stone-400 text-sm font-medium whitespace-nowrap">
                            CROSSTRADE ID
                          </th>
                          <th className="text-left p-4 text-stone-400 text-sm font-medium whitespace-nowrap">
                            SENDER
                          </th>
                          <th className="text-center p-4 text-stone-400 text-sm font-medium whitespace-nowrap">
                            GIVING
                          </th>
                          <th className="text-left p-4 text-stone-400 text-sm font-medium whitespace-nowrap">
                            FROM &
                          </th>
                          <th className="text-left p-4 text-stone-400 text-sm font-medium whitespace-nowrap">
                            RECEIVER
                          </th>
                          <th className="text-center p-4 text-stone-400 text-sm font-medium whitespace-nowrap">
                            RECEIVING
                          </th>
                          <th className="text-left p-4 text-stone-400 text-sm font-medium whitespace-nowrap">
                            TO
                          </th>
                          <th className="text-left p-4 text-stone-400 text-sm font-medium whitespace-nowrap">
                            BUYER ID
                          </th>
                          <th className="text-center p-4 text-stone-400 text-sm font-medium whitespace-nowrap">
                            DETAILS
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.currency_crosstrade_logs.map((trade) => (
                          <React.Fragment key={trade.id}>
                            {/* Main Table Row */}
                            <tr className="border-t border-stone-800 hover:bg-stone-900/30 transition-colors text-xs">
                              {/* ID */}
                              <td className="p-4">
                                <span className="text-stone-400 font-mono">
                                  #{trade.id}
                                </span>
                              </td>

                              {/* SENDER */}
                              <td className="p-4">
                                <Link
                                  href={`/dashboard/accounts/${trade.from_bot_account_id}`}
                                  target="_blank"
                                  className="text-white hover:text-blue-400 transition-colors"
                                >
                                  {trade.from_bot_account_name}
                                </Link>
                              </td>

                              {/* GIVING */}
                              <td className="p-4 text-center">
                                <span className="flex items-center justify-center gap-1 px-2 py-1 rounded-full border text-xs font-medium text-nowrap w-full text-center bg-red-600/20 text-red-400 border-red-800">
                                  {trade.from_amount} {trade.from_currency_name}
                                </span>
                              </td>

                              {/* FROM bot */}
                              <td className="p-4">
                                <span className="text-white font-medium">
                                  {trade.from_bot_name}
                                </span>
                              </td>

                              {/* RECEIVER */}
                              <td className="p-4">
                                <Link
                                  href={`/dashboard/accounts/${trade.to_bot_account_id}`}
                                  target="_blank"
                                  className="text-white hover:text-blue-400 transition-colors"
                                >
                                  {trade.to_bot_account_name}
                                </Link>
                              </td>

                              {/* RECEIVING */}
                              <td className="p-4 text-center">
                                <span className="flex items-center justify-center gap-1 px-2 py-1 rounded-full border text-xs font-medium text-nowrap w-full text-center bg-green-600/20 text-green-400 border-green-800">
                                  {trade.to_amount} {trade.to_currency_name}
                                </span>
                              </td>

                              {/* TO bot */}
                              <td className="p-4">
                                <span className="text-white font-medium">
                                  {trade.to_bot_name}
                                </span>
                              </td>

                              {/* BUYER ID */}
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-stone-500 shrink-0" />
                                  <span className="text-white">
                                    {trade.traded_with || "--"}
                                  </span>
                                </div>
                              </td>

                              {/* Expand */}
                              <td className="p-4">
                                <div className="flex items-center justify-center">
                                  <button
                                    onClick={() => toggleExpand(trade.id)}
                                    className="p-1.5 hover:bg-stone-800 rounded transition-colors cursor-pointer"
                                    title={
                                      expandedTradeId === trade.id
                                        ? "Hide details"
                                        : "Show details"
                                    }
                                  >
                                    {expandedTradeId === trade.id ? (
                                      <ChevronUp className="h-4 w-4 text-stone-400" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-stone-400" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Expanded Row */}
                            {expandedTradeId === trade.id && (
                              <tr className="bg-black/20 border-b border-stone-800">
                                <td colSpan={9} className="p-0">
                                  <div className="p-6 border-t border-stone-800">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                                      {/* Note */}
                                      <div className="space-y-4 bg-black/20 p-3 rounded-lg border border-stone-800">
                                        <h4 className="text-sm font-medium text-stone-300">
                                          Note
                                        </h4>
                                        <div className="space-y-4 text-xs">
                                          <div className="text-white italic">
                                            {trade.note
                                              ? `" ${trade.note} "`
                                              : `--`}
                                          </div>
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <div className="text-stone-400 mb-1">
                                                Created
                                              </div>
                                              <div className="text-white">
                                                {formatDateTime(
                                                  trade.created_at
                                                )}
                                              </div>
                                            </div>
                                            <div>
                                              <div className="text-stone-400 mb-1">
                                                Updated
                                              </div>
                                              <div className="text-white">
                                                {formatDateTime(
                                                  trade.updated_at
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Actions */}
                                      <div className="space-y-4">
                                        <h4 className="text-sm font-medium text-stone-300">
                                          Actions
                                        </h4>
                                        <div className="flex items-center flex-wrap gap-2">
                                          {trade.trade_link ? (
                                            <Link
                                              href={trade.trade_link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className={`px-3 py-1.5 ${BLUE_Button} text-white text-sm rounded transition-colors cursor-pointer flex items-center gap-2`}
                                            >
                                              <LinkIcon className="h-3 w-3" />
                                              Trade Link
                                            </Link>
                                          ) : (
                                            <button
                                              disabled
                                              className="px-3 py-1.5 bg-blue-800 text-white text-sm rounded cursor-not-allowed flex items-center gap-2 opacity-50"
                                            >
                                              <LinkIcon className="h-3 w-3" />
                                              No Trade Link
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bottom Pagination */}
                {data && data.total_pages > 1 && (
                  <div className="flex items-center justify-center mt-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(filters.page - 1)}
                        disabled={filters.page <= 1}
                        className={`px-4 py-2 ${STONE_Button} text-stone-300 text-sm rounded cursor-pointer ${
                          filters.page <= 1
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        Previous
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: Math.min(5, data.total_pages) },
                          (_, i) => {
                            let pageNum: number;
                            if (data.total_pages <= 5) {
                              pageNum = i + 1;
                            } else if (filters.page <= 3) {
                              pageNum = i + 1;
                            } else if (filters.page >= data.total_pages - 2) {
                              pageNum = data.total_pages - 4 + i;
                            } else {
                              pageNum = filters.page - 2 + i;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`px-3 py-1 rounded text-sm ${
                                  filters.page === pageNum
                                    ? "bg-amber-600 text-white"
                                    : `${STONE_Button} text-stone-300`
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                        )}
                      </div>

                      <button
                        onClick={() => handlePageChange(filters.page + 1)}
                        disabled={filters.page >= data.total_pages}
                        className={`px-4 py-2 ${STONE_Button} text-stone-300 text-sm rounded cursor-pointer ${
                          filters.page >= data.total_pages
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  );
}
