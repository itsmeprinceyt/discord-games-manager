"use client";
import React from "react";
import { useState, useEffect, useCallback } from "react";
import PageWrapper from "../../(components)/PageWrapper";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  DollarSign,
  IndianRupee,
  User,
  Calendar,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  Link as LinkIcon,
  Filter,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import getAxiosErrorMessage from "../../../utils/Variables/getAxiosError.util";
import { formatDateTime } from "../../../utils/main.util";
import { BLUE_Button, STONE_Button } from "../../../utils/CSS/Button.util";

interface UserCrossTradeLog {
  id: string;
  bot_name: string;
  bot_account_id: string;
  bot_account_name: string;
  crosstrade_date: string;
  currency: "inr" | "usd";
  crosstrade_via: "upi" | "paypal" | "wise";
  amount_received: number;
  rate: string | null;
  conversion_rate: number | null;
  net_amount: number | null;
  traded_with: string | null;
  trade_link: string | null;
  traded: boolean;
  paid: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

interface UserCrossTradesResponse {
  cross_trade_logs: UserCrossTradeLog[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export default function UserCrossTradeLogs() {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [data, setData] = useState<UserCrossTradesResponse | null>(null);
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Filters
  const [filters, setFilters] = useState({
    bot_account_id: "",
    start_date: "",
    end_date: "",
    currency: "",
    crosstrade_via: "",
    bot_name: "",
    page: 1,
    limit: 20,
  });

  // Add state for bot accounts
  const [botAccounts, setBotAccounts] = useState<
    Array<{
      id: string;
      name: string;
    }>
  >([]);

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();

    if (filters.bot_account_id)
      params.append("bot_account_id", filters.bot_account_id);
    if (filters.start_date) params.append("start_date", filters.start_date);
    if (filters.end_date) params.append("end_date", filters.end_date);
    if (filters.currency) params.append("currency", filters.currency);
    if (filters.crosstrade_via)
      params.append("crosstrade_via", filters.crosstrade_via);
    if (filters.bot_name) params.append("bot_name", filters.bot_name);
    params.append("page", filters.page.toString());
    params.append("limit", filters.limit.toString());

    return params.toString();
  }, [filters]);

  const fetchBotAccounts = useCallback(async () => {
    try {
      const response = await axios.get(`/api/dashboard/accounts`);
      if (response.data.success && response.data.data) {
        setBotAccounts(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch bot accounts:", error);
    }
  }, []);

  const fetchCrossTradeData = useCallback(async () => {
    try {
      setLoading(true);
      const queryString = buildQueryString();
      const response = await axios.get(
        `/api/dashboard/crosstrade-logs?${queryString}`,
      );

      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error: unknown) {
      toast.error(
        getAxiosErrorMessage(error, "Failed to load cross trade data"),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [buildQueryString]);

  useEffect(() => {
    fetchCrossTradeData();
    fetchBotAccounts();
  }, [fetchCrossTradeData, fetchBotAccounts]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCrossTradeData();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const clearFilters = () => {
    setFilters({
      bot_account_id: "",
      start_date: "",
      end_date: "",
      currency: "",
      crosstrade_via: "",
      bot_name: "",
      page: 1,
      limit: 20,
    });
  };

  const formatCurrency = (amount: number, currency: "inr" | "usd") => {
    if (currency === "inr") {
      return new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } else {
      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    }
  };

  const getStatusColor = (value: boolean) => {
    if (value) return "bg-green-900/30 text-green-400 border-green-800";
    return "bg-yellow-900/30 text-yellow-400 border-yellow-800";
  };

  const getStatusText = (value: boolean) => {
    if (value) return "Completed";
    return "Pending";
  };

  const getPaymentMethodText = (method: "upi" | "paypal" | "wise") => {
    switch (method) {
      case "upi":
        return "UPI";
      case "paypal":
        return "PayPal";
      case "wise":
        return "Wise";
      default:
        return method;
    }
  };

  const toggleExpand = (tradeId: string) => {
    setExpandedTradeId(expandedTradeId === tradeId ? null : tradeId);
  };

  return (
    <PageWrapper withSidebar sidebarRole="user">
      <div className="min-h-screen p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link
                href={`/dashboard`}
                className="p-2 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-5 w-5 text-stone-400" />
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-medium text-white">
                  Cross Trade Logs
                </h1>
                <p className="text-stone-400 text-sm">
                  View all cross trades across all your accounts
                </p>
              </div>
            </div>

            <div className="flex justify-end flex-wrap gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 ${STONE_Button} text-stone-300 rounded-lg text-sm transition-colors cursor-pointer flex items-center gap-2`}
              >
                <Filter className="h-4 w-4" />
                Filters {showFilters ? "(Hide)" : ""}
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
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  Bot Account
                </label>
                <select
                  value={filters.bot_account_id}
                  onChange={(e) =>
                    handleFilterChange("bot_account_id", e.target.value)
                  }
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="">All Accounts</option>
                  {botAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  Bot Name
                </label>
                <select
                  value={filters.bot_name}
                  onChange={(e) =>
                    handleFilterChange("bot_name", e.target.value)
                  }
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="">All Bots</option>
                  <option value="Sofi">Sofi</option>
                  <option value="Karuta">Karuta</option>
                  {/* Add more bots as needed */}
                </select>
              </div>

              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  Currency
                </label>
                <select
                  value={filters.currency}
                  onChange={(e) =>
                    handleFilterChange("currency", e.target.value)
                  }
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="">All Currencies</option>
                  <option value="inr">INR</option>
                  <option value="usd">USD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  Payment Method
                </label>
                <select
                  value={filters.crosstrade_via}
                  onChange={(e) =>
                    handleFilterChange("crosstrade_via", e.target.value)
                  }
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="">All Methods</option>
                  <option value="upi">UPI</option>
                  <option value="paypal">PayPal</option>
                  <option value="wise">Wise</option>
                </select>
              </div>

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
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

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
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  Items per Page
                </label>
                <select
                  value={filters.limit}
                  onChange={(e) => handleFilterChange("limit", e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-white text-sm"
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
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-stone-400 mt-2">Loading cross trade data...</p>
          </div>
        ) : (
          <>
            {/* Empty State */}
            {data?.cross_trade_logs.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-stone-700 rounded-lg">
                <h3 className="text-lg font-medium text-stone-300 mb-2">
                  No cross trades found
                </h3>
                <p className="text-stone-500 max-w-md mx-auto mb-6">
                  Start by creating your first cross trade record or adjust your
                  filters.
                </p>
                <div className="flex gap-3 justify-center">
                  {Object.values(filters).some(
                    (value) => value && value !== "1" && value !== "20",
                  ) && (
                    <button
                      onClick={clearFilters}
                      className={`px-4 py-2 ${STONE_Button} text-stone-300 rounded-lg text-sm transition-colors cursor-pointer`}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Results Count and Pagination */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-stone-400 text-sm">
                    Showing {(filters.page - 1) * filters.limit + 1} to{" "}
                    {Math.min(
                      filters.page * filters.limit,
                      data?.total_count || 0,
                    )}{" "}
                    of {data?.total_count} trades
                  </div>

                  {data && data.total_pages > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(filters.page - 1)}
                        disabled={filters.page <= 1}
                        className={`px-3 py-1.5 ${STONE_Button} text-stone-300 text-sm rounded cursor-pointer ${filters.page <= 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        Previous
                      </button>

                      <span className="text-white text-sm px-2">
                        Page {filters.page} of {data.total_pages}
                      </span>

                      <button
                        onClick={() => handlePageChange(filters.page + 1)}
                        disabled={filters.page >= data.total_pages}
                        className={`px-3 py-1.5 ${STONE_Button} text-stone-300 text-sm rounded cursor-pointer ${filters.page >= data.total_pages ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>

                {/* Trades Table */}
                <div className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden select-text">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-stone-800">
                          <th className="text-left p-4 text-stone-400 text-sm font-medium whitespace-nowrap">
                            CROSSTRADE ID
                          </th>
                          <th className="text-left p-4 text-stone-400 text-sm font-medium whitespace-nowrap">
                            ACCOUNT
                          </th>
                          <th className="text-left p-4 text-stone-400 text-sm font-medium whitespace-nowrap">
                            BOT
                          </th>
                          <th className="text-left p-4 text-stone-400 text-sm font-medium whitespace-nowrap">
                            CROSSTRADE
                          </th>
                          <th className="text-left p-4 text-stone-400 text-sm font-medium whitespace-nowrap">
                            AMOUNT
                          </th>
                          <th className="text-left p-4 text-stone-400 text-sm font-medium whitespace-nowrap">
                            NET AMOUNT
                          </th>
                          <th className="text-left p-4 text-stone-400 text-sm font-medium whitespace-nowrap">
                            RATE
                          </th>
                          <th className="text-left p-4 text-stone-400 text-sm font-medium whitespace-nowrap">
                            BUYER ID
                          </th>
                          <th className="text-left p-4 text-stone-400 text-sm font-medium whitespace-nowrap">
                            VIA
                          </th>
                          <th className="text-center p-4 text-stone-400 text-sm font-medium whitespace-nowrap">
                            TRADE
                          </th>
                          <th className="text-center p-4 text-stone-400 text-sm font-medium whitespace-nowrap">
                            PAYMENT
                          </th>
                          <th className="text-center p-4 text-stone-400 text-sm font-medium whitespace-nowrap">
                            DETAILS
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.cross_trade_logs.map((trade) => (
                          <React.Fragment key={trade.id}>
                            {/* Main Table Row */}
                            <tr className="border-t border-stone-800 hover:bg-stone-900/30 transition-colors text-xs">
                              {/* ID */}
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-stone-400 font-mono">
                                    #{trade.id}
                                  </span>
                                </div>
                              </td>

                              {/* Account */}
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/dashboard/accounts/${trade.bot_account_id}`}
                                    target="_blank"
                                    className="hover:text-blue-400 transition-colors"
                                  >
                                    <span className="text-white hover:text-blue-400">
                                      {trade.bot_account_name}
                                    </span>
                                  </Link>
                                </div>
                              </td>

                              {/* BOT */}
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-white">
                                    {trade.bot_name}
                                  </span>
                                </div>
                              </td>

                              {/* Date */}
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-stone-500 shrink-0" />
                                  <div className="min-w-0">
                                    <div className="text-white truncate">
                                      {formatDateTime(trade.crosstrade_date)}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Amount */}
                              <td className="p-4">
                                <div className="flex items-center gap-1">
                                  {trade.currency === "inr" ? (
                                    <IndianRupee className="h-4 w-4 text-green-400 shrink-0" />
                                  ) : (
                                    <DollarSign className="h-4 w-4 text-green-400 shrink-0" />
                                  )}
                                  <div className="min-w-0">
                                    <div className="text-white font-medium">
                                      {formatCurrency(
                                        trade.amount_received,
                                        trade.currency,
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Net amount */}
                              <td className="p-4">
                                <div className="flex items-center gap-1">
                                  {trade.net_amount &&
                                  trade.net_amount !== trade.amount_received ? (
                                    trade.currency === "inr" ? (
                                      <IndianRupee className="h-4 w-4 text-green-400 shrink-0" />
                                    ) : trade.currency === "usd" ? (
                                      <DollarSign className="h-4 w-4 text-green-400 shrink-0" />
                                    ) : (
                                      "--"
                                    )
                                  ) : null}
                                  <div className="min-w-0 text-white font-medium">
                                    {trade.net_amount &&
                                    trade.net_amount !== trade.amount_received
                                      ? formatCurrency(
                                          trade.net_amount,
                                          trade.currency,
                                        )
                                      : `--`}
                                  </div>
                                </div>
                              </td>

                              {/* Rate */}
                              <td className="p-4 text-white">
                                {trade.rate || "--"}
                              </td>

                              {/* Buyer */}
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-stone-500 shrink-0" />
                                  <div className="min-w-0">
                                    <div className="text-white truncate">
                                      {trade.traded_with || "--"}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* VIA */}
                              <td className="p-4">
                                <div className=" text-white">
                                  {getPaymentMethodText(trade.crosstrade_via)}
                                </div>
                              </td>

                              {/* Traded */}
                              <td className="p-4 text-nowrap">
                                <div
                                  className={`text-center items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(
                                    trade.traded,
                                  )}`}
                                >
                                  <span className="text-xs font-medium">
                                    {getStatusText(trade.traded)}
                                  </span>
                                </div>
                              </td>

                              {/* Paid */}
                              <td className="p-4 text-nowrap">
                                <div
                                  className={`text-center items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(
                                    trade.paid,
                                  )}`}
                                >
                                  <span className="text-xs font-medium">
                                    {getStatusText(trade.paid)}
                                  </span>
                                </div>
                              </td>

                              {/* Expand Button */}
                              <td className="p-4">
                                <div className="flex items-center justify-center gap-2">
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

                            {/* Expanded Details Row */}
                            {expandedTradeId === trade.id && (
                              <tr className="bg-black/20 border-b border-stone-800">
                                <td colSpan={12} className="p-0">
                                  <div className="p-6 border-t border-stone-800">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                                      {/* Trade Details */}
                                      <div className="space-y-4 bg-black/20 p-3 rounded-lg border border-stone-800 ">
                                        <h4 className="text-sm font-medium text-stone-300">
                                          Trade Details
                                        </h4>
                                        <div className="space-y-3 text-xs">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <div className="text-stone-400 mb-1">
                                                Account
                                              </div>
                                              <div className="text-white flex items-center gap-2">
                                                <Link
                                                  href={`/dashboard/accounts/${trade.bot_account_id}`}
                                                  className="hover:text-blue-400 transition-colors"
                                                >
                                                  {trade.bot_account_name}
                                                </Link>
                                              </div>
                                            </div>
                                            <div>
                                              <div className="text-stone-400 mb-1">
                                                Bot
                                              </div>
                                              <div className="text-white">
                                                {trade.bot_name}
                                              </div>
                                            </div>
                                          </div>

                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <div className="text-stone-400 mb-1">
                                                Currency
                                              </div>
                                              <div className="text-white flex items-center">
                                                {trade.currency === "inr" ? (
                                                  <>
                                                    <IndianRupee className="h-3.5 w-3.5 text-green-400" />
                                                    INR
                                                  </>
                                                ) : (
                                                  <>
                                                    <DollarSign className="h-3.5 w-3.5 text-green-400" />
                                                    USD
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                            <div>
                                              <div className="text-stone-400  mb-1">
                                                Payment Method
                                              </div>
                                              <div className="text-white flex items-center gap-2">
                                                {getPaymentMethodText(
                                                  trade.crosstrade_via,
                                                )}
                                              </div>
                                            </div>
                                          </div>

                                          {trade.conversion_rate && (
                                            <div>
                                              <div className="text-stone-400  mb-1">
                                                Conversion Rate
                                              </div>
                                              <div className="text-white font-mono">
                                                {trade.conversion_rate}
                                              </div>
                                            </div>
                                          )}

                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <div className="text-stone-400 mb-1">
                                                Created
                                              </div>
                                              <div className="text-white">
                                                {formatDateTime(
                                                  trade.created_at,
                                                )}
                                              </div>
                                            </div>
                                            <div>
                                              <div className="text-stone-400 mb-1">
                                                Updated
                                              </div>
                                              <div className="text-white ">
                                                {formatDateTime(
                                                  trade.updated_at,
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Financial Details */}
                                      <div className="space-y-4 bg-black/20 p-3 rounded-lg border border-stone-800 ">
                                        <h4 className="text-sm font-medium text-stone-300">
                                          Financial Details
                                        </h4>
                                        <div className="space-y-3 text-xs">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <div className="text-stone-400 mb-1">
                                                Amount Received
                                              </div>
                                              <div className="text-white font-medium">
                                                {formatCurrency(
                                                  trade.amount_received,
                                                  trade.currency,
                                                )}
                                              </div>
                                            </div>
                                            {trade.net_amount && (
                                              <div>
                                                <div className="text-stone-400 mb-1">
                                                  Net Amount
                                                </div>
                                                <div className="text-white font-medium">
                                                  {formatCurrency(
                                                    trade.net_amount,
                                                    trade.currency,
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                          </div>

                                          {trade.rate && (
                                            <div>
                                              <div className="text-stone-400  mb-1">
                                                Rate
                                              </div>
                                              <div className="text-white font-mono">
                                                {trade.rate}
                                              </div>
                                            </div>
                                          )}

                                          {trade.conversion_rate &&
                                            trade.currency === "usd" && (
                                              <div>
                                                <div className="text-stone-400 text-sm mb-1">
                                                  Converted Approx Value
                                                </div>
                                                <div className="text-white text-sm font-medium flex items-center">
                                                  <IndianRupee className="h-3.5 w-3.5 text-green-400" />
                                                  {trade.net_amount ? (
                                                    <>
                                                      {formatCurrency(
                                                        trade.net_amount *
                                                          trade.conversion_rate,
                                                        "inr",
                                                      )}
                                                    </>
                                                  ) : (
                                                    <>
                                                      `Net amount not available`
                                                    </>
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                        </div>
                                      </div>

                                      {/* Notes */}
                                      <div className="space-y-4 bg-black/20 p-3 rounded-lg border border-stone-800">
                                        <h4 className="text-sm font-medium text-stone-300">
                                          Note
                                        </h4>
                                        <div className="space-y-4 text-xs">
                                          {trade.note ? (
                                            <div>
                                              <div className="text-white italic">
                                                {`" ${trade.note} "`}
                                              </div>
                                            </div>
                                          ) : (
                                            <div>
                                              <div className="text-white italic">
                                                {`--`}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Actions & Notes */}
                                      <div className="space-y-4 ">
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
                                              disabled={true}
                                              rel="noopener noreferrer"
                                              className={`px-3 py-1.5 bg-blue-800 text-white text-sm rounded cursor-not-allowed flex items-center gap-2 opacity-50`}
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
                        className={`px-4 py-2 ${STONE_Button} text-stone-300 text-sm rounded cursor-pointer ${filters.page <= 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        Previous
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: Math.min(5, data.total_pages) },
                          (_, i) => {
                            let pageNum;
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
                                    ? "bg-blue-600 text-white"
                                    : `${STONE_Button} text-stone-300`
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          },
                        )}
                      </div>

                      <button
                        onClick={() => handlePageChange(filters.page + 1)}
                        disabled={filters.page >= data.total_pages}
                        className={`px-4 py-2 ${STONE_Button} text-stone-300 text-sm rounded cursor-pointer ${filters.page >= data.total_pages ? "opacity-50 cursor-not-allowed" : ""}`}
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
