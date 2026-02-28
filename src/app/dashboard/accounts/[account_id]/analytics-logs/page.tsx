"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  DollarSign,
  IndianRupee,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  RefreshCw,
  Info,
  Award,
  Target,
  Zap,
  Clock,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import axios from "axios";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";
import getAxiosErrorMessage from "../../../../../utils/Variables/getAxiosError.util";
import { formatDateTime } from "../../../../../utils/main.util";
import Loader from "../../../../(components)/Loader";
import PageWrapper from "../../../../(components)/PageWrapper";
import {
  BLUE_Button,
  STONE_Button,
} from "../../../../../utils/CSS/Button.util";

interface Trade {
  id: string;
  date: string;
  currency: "usd" | "inr";
  amount_received: number;
  net_amount: number;
  conversion_rate: number | null;
  usd_converted_to_inr: number | null;
  combined_inr_value: number | null;
  traded_with: string | null;
  rate: string | null;
  note: string | null;
}

interface YearlyAnalytics {
  year: number;
  year_code: string;
  trade_count: number;
  total_usd_amount: number;
  total_inr_amount: number;
  total_usd_converted_to_inr: number;
  total_combined_inr: number;
  usd_trades_count: number;
  inr_trades_count: number;
  average_trade_value_inr: number;
}

interface MonthlyAnalytics {
  month: string;
  year: number;
  month_code: string;
  trade_count: number;
  total_usd_amount: number;
  total_inr_amount: number;
  total_usd_converted_to_inr: number;
  total_combined_inr: number;
  trades: Trade[];
}

interface CurrencyBreakdown {
  count: number;
  total: number;
  percentage: string | number;
}

interface AnalyticsSummary {
  total_trades: number;
  total_usd_amount: number;
  total_inr_amount: number;
  total_usd_converted_to_inr: number;
  total_combined_inr: number;
  average_trade_value_inr: number;
  currency_breakdown: {
    usd: CurrencyBreakdown;
    inr: CurrencyBreakdown;
  };
}

interface AnalyticsMeta {
  user_id: string;
  account_id: string;
  total_months: number;
  total_years: number;
}

interface AnalyticsData {
  yearly_analytics: YearlyAnalytics[];
  monthly_analytics: MonthlyAnalytics[];
  summary: AnalyticsSummary;
  meta: AnalyticsMeta;
}

interface AnalyticsResponse {
  success: boolean;
  data: AnalyticsData;
}

interface PieChartDataPoint {
  name: string;
  value: number;
  percentage: number;
  currency: string;
  color: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: PieChartDataPoint }>;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-stone-900 border border-stone-700 rounded-lg p-3 shadow-xl">
        <p className="text-white text-sm font-medium mb-1">{data.name}</p>
        <p className="text-stone-300 text-xs">
          Amount: {data.currency === "USD" ? "$" : "₹"}
          {data.value.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        <p className="text-stone-400 text-xs mt-1">
          {data.percentage.toFixed(1)}% of total
        </p>
      </div>
    );
  }
  return null;
};

export default function AccountAnalyticsLogs() {
  const params = useParams();
  const accountId = params?.account_id as string;

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"summary" | "detailed">("summary");

  const fetchAnalytics = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<AnalyticsResponse>(
        `/api/dashboard/account/${accountId}/analytics-logs`
      );
      if (response.data.success) {
        setAnalytics(response.data.data);
        if (response.data.data.monthly_analytics.length > 0) {
          setSelectedMonth(response.data.data.monthly_analytics[0].month_code);
        }
        if (response.data.data.yearly_analytics.length > 0) {
          setSelectedYear(response.data.data.yearly_analytics[0].year_code);
        }
      }
    } catch (err: unknown) {
      const message = getAxiosErrorMessage(
        err,
        "Error fetching analytics data"
      );
      toast.error(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    if (accountId) fetchAnalytics();
  }, [accountId, fetchAnalytics]);

  const getSelectedMonthData = (): MonthlyAnalytics | null => {
    if (!analytics || !selectedMonth) return null;
    return (
      analytics.monthly_analytics.find((m) => m.month_code === selectedMonth) ||
      null
    );
  };

  const getSelectedYearData = (): YearlyAnalytics | null => {
    if (!analytics || !selectedYear) return null;
    return (
      analytics.yearly_analytics.find((y) => y.year_code === selectedYear) ||
      null
    );
  };

  const formatCurrency = (
    amount: number,
    currency: "USD" | "INR" = "INR"
  ): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency === "USD" ? "USD" : "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatCompactCurrency = (
    amount: number,
    currency: "USD" | "INR" = "INR"
  ): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency === "USD" ? "USD" : "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: "compact",
      compactDisplay: "short",
    }).format(amount);
  };

  const formatNumber = (num: number): string =>
    new Intl.NumberFormat("en-IN").format(num);

  const exportToCSV = (): void => {
    if (!analytics) return;
    const allTrades = analytics.monthly_analytics.flatMap(
      (month) => month.trades
    );
    const csvData = allTrades.map((trade) => ({
      Date: formatDateTime(trade.date),
      Currency: trade.currency.toUpperCase(),
      "Amount Received": trade.amount_received,
      "Net Amount": trade.net_amount,
      "Conversion Rate": trade.conversion_rate || "N/A",
      "USD Converted to INR": trade.usd_converted_to_inr || "N/A",
      "Combined INR Value": trade.combined_inr_value || "N/A",
      "Traded With": trade.traded_with || "N/A",
      Rate: trade.rate || "N/A",
      Note: trade.note || "N/A",
    }));
    const headers = Object.keys(csvData[0]).join(",");
    const rows = csvData.map((obj) => Object.values(obj).join(",")).join("\n");
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `account-${accountId}-analytics-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Analytics exported successfully!");
  };

  const getPieChartData = (): PieChartDataPoint[] => {
    if (!analytics) return [];
    const totalUSD = analytics.summary.total_usd_converted_to_inr;
    const totalINR = analytics.summary.total_inr_amount;
    return [
      {
        name: "USD Trades (Converted to INR)",
        value: totalUSD,
        percentage: (totalUSD / analytics.summary.total_combined_inr) * 100,
        currency: "USD",
        color: "#4ade80",
      },
      {
        name: "INR Trades",
        value: totalINR,
        percentage: (totalINR / analytics.summary.total_combined_inr) * 100,
        currency: "INR",
        color: "#fbbf24",
      },
    ];
  };

  const getAdditionalStats = () => {
    if (!analytics) return null;
    const { summary } = analytics;
    const totalValue = summary.total_combined_inr;
    const totalTrades = summary.total_trades;
    const usdCount = summary.currency_breakdown.usd.count;
    const inrCount = summary.currency_breakdown.inr.count;
    const largestTrade = analytics.monthly_analytics
      .flatMap((m) => m.trades)
      .reduce((max, trade) => {
        const value = trade.combined_inr_value || 0;
        return value > (max?.value || 0) ? { value, date: trade.date } : max;
      }, {} as { value: number; date: string } | null);
    const monthlyAverage =
      analytics.monthly_analytics.length > 0
        ? totalValue / analytics.monthly_analytics.length
        : 0;
    return {
      largestTrade,
      monthlyAverage,
      usdToInrRatio: usdCount > 0 ? (usdCount / totalTrades) * 100 : 0,
      inrRatio: inrCount > 0 ? (inrCount / totalTrades) * 100 : 0,
      avgTradesPerMonth:
        analytics.monthly_analytics.length > 0
          ? totalTrades / analytics.monthly_analytics.length
          : 0,
    };
  };

  if (loading) {
    return (
      <PageWrapper withSidebar sidebarRole="user">
        <div className="min-h-screen p-4 md:p-6 flex items-center justify-center">
          <Loader />
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper withSidebar sidebarRole="user">
        <div className="min-h-screen p-4 md:p-6">
          <div className="mb-8 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-red-400">Error: {error}</p>
            <button
              onClick={fetchAnalytics}
              className="mt-2 px-4 py-2 bg-red-800 hover:bg-red-700 rounded text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (!analytics || analytics.monthly_analytics.length === 0) {
    return (
      <PageWrapper withSidebar sidebarRole="user">
        <div className="min-h-screen p-4 md:p-6">
          <div className="text-center py-12 bg-black/30 border border-stone-800 rounded-lg">
            <BarChart3 className="h-12 w-12 text-stone-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No Analytics Data
            </h3>
            <p className="text-stone-400 text-sm max-w-md mx-auto">
              No cross-trades found for this account yet.
            </p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  const selectedMonthData = getSelectedMonthData();
  const selectedYearData = getSelectedYearData();
  const pieChartData = getPieChartData();
  const additionalStats = getAdditionalStats();

  return (
    <PageWrapper withSidebar sidebarRole="user">
      <div className="min-h-screen p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-medium text-white mb-2">
              Account Analytics
            </h1>
            <p className="text-stone-400 text-sm">
              Cross-trade performance for this account
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("summary")}
              className={`px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                viewMode === "summary"
                  ? `${BLUE_Button} text-white`
                  : `${STONE_Button} text-stone-300`
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setViewMode("detailed")}
              className={`px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                viewMode === "detailed"
                  ? `${BLUE_Button} text-white`
                  : `${STONE_Button} text-stone-300`
              }`}
            >
              Detailed
            </button>
            <button
              onClick={exportToCSV}
              className={`p-2.5 ${STONE_Button} text-stone-300 rounded-lg text-sm transition-colors cursor-pointer flex items-center gap-2`}
              title="Export to CSV"
            >
              <Download className="h-4 w-4 text-stone-400" />
            </button>
            <button
              onClick={fetchAnalytics}
              className={`p-2.5 ${STONE_Button} text-stone-300 rounded-lg text-sm transition-colors cursor-pointer flex items-center gap-2`}
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4 text-stone-400" />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-black/30 border border-stone-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-stone-400 text-xs">Total Trades</span>
              <BarChart3 className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-2xl font-medium text-white">
              {formatNumber(analytics.summary.total_trades)}
            </p>
          </div>
          <div className="bg-black/30 border border-stone-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-stone-400 text-xs">Total Net USD</span>
              <DollarSign className="h-4 w-4 text-green-400" />
            </div>
            <p className="text-2xl font-medium text-white">
              {formatCurrency(analytics.summary.total_usd_amount, "USD")}
            </p>
          </div>
          <div className="bg-black/30 border border-stone-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-stone-400 text-xs">Total Net INR</span>
              <IndianRupee className="h-4 w-4 text-yellow-400" />
            </div>
            <p className="text-2xl font-medium text-white">
              {formatCurrency(analytics.summary.total_inr_amount)}
            </p>
          </div>
          <div className="bg-black/30 border border-stone-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-stone-400 text-xs">
                Combined INR (All Trades)
              </span>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </div>
            <p className="text-2xl font-medium text-white">
              {formatCurrency(analytics.summary.total_combined_inr)}
            </p>
          </div>
        </div>

        {/* Currency Distribution and Trade Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-black/30 border border-stone-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-stone-400" />
              Currency Distribution (INR Value)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    strokeWidth={0}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<CustomTooltip />}
                    wrapperStyle={{ outline: "none" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-xs text-stone-400">
                  USD Converted: {pieChartData[0].percentage.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <span className="text-xs text-stone-400">
                  Direct INR: {pieChartData[1].percentage.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-stone-800">
              <div className="flex justify-between text-xs">
                <span className="text-stone-400">USD Converted to INR:</span>
                <span className="text-green-400 font-medium">
                  {formatCurrency(pieChartData[0].value)}
                </span>
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className="text-stone-400">Direct INR:</span>
                <span className="text-amber-400 font-medium">
                  {formatCurrency(pieChartData[1].value)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-black/30 border border-stone-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-stone-400" />
              Trade Performance Metrics
            </h3>
            <div className="space-y-4">
              <div className="bg-stone-900/30 rounded-lg p-3">
                <span className="text-stone-400 text-xs flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Average Trade Value (INR)
                </span>
                <p className="text-2xl font-medium text-white mt-1">
                  {formatCurrency(analytics.summary.average_trade_value_inr)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-stone-900/30 rounded-lg p-3">
                  <span className="text-stone-400 text-xs flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    Largest Trade
                  </span>
                  <p className="text-lg font-medium text-white">
                    {additionalStats?.largestTrade?.value
                      ? formatCurrency(additionalStats.largestTrade.value)
                      : "N/A"}
                  </p>
                  {additionalStats?.largestTrade?.date && (
                    <p className="text-xs text-stone-500 mt-1">
                      {formatDateTime(additionalStats.largestTrade.date)}
                    </p>
                  )}
                </div>
                <div className="bg-stone-900/30 rounded-lg p-3">
                  <span className="text-stone-400 text-xs flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Monthly Average
                  </span>
                  <p className="text-lg font-medium text-white">
                    {formatCurrency(additionalStats?.monthlyAverage || 0)}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">per month</p>
                </div>
                <div className="bg-stone-900/30 rounded-lg p-3">
                  <span className="text-stone-400 text-xs flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    USD/INR Mix
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-green-400">
                      {additionalStats?.usdToInrRatio.toFixed(1)}% USD
                    </span>
                    <span className="text-xs text-stone-600">|</span>
                    <span className="text-xs text-amber-400">
                      {additionalStats?.inrRatio.toFixed(1)}% INR
                    </span>
                  </div>
                </div>
                <div className="bg-stone-900/30 rounded-lg p-3">
                  <span className="text-stone-400 text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Avg Trades/Month
                  </span>
                  <p className="text-lg font-medium text-white">
                    {additionalStats?.avgTradesPerMonth.toFixed(1)}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    across {analytics.monthly_analytics.length} months
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-800">
                <div>
                  <span className="text-stone-400 text-xs">USD Trades</span>
                  <p className="text-lg font-medium text-white">
                    {analytics.summary.currency_breakdown.usd.count}
                  </p>
                  <p className="text-xs text-green-400">
                    {formatCompactCurrency(
                      analytics.summary.currency_breakdown.usd.total,
                      "USD"
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-stone-400 text-xs">INR Trades</span>
                  <p className="text-lg font-medium text-white">
                    {analytics.summary.currency_breakdown.inr.count}
                  </p>
                  <p className="text-xs text-amber-400">
                    {formatCompactCurrency(
                      analytics.summary.currency_breakdown.inr.total
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Yearly Breakdown */}
        <div className="bg-black/30 border border-stone-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-stone-400" />
              Yearly Breakdown
            </h2>
            {analytics.yearly_analytics.length > 0 && (
              <select
                value={selectedYear || ""}
                onChange={(e) => setSelectedYear(e.target.value)}
                className={`px-3 p-2 ${STONE_Button} text-stone-300 rounded-lg text-sm transition-colors cursor-pointer`}
              >
                {analytics.yearly_analytics.map((year) => (
                  <option key={year.year_code} value={year.year_code}>
                    {year.year} ({year.trade_count} trades)
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedYearData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-stone-900/50 rounded-lg p-3">
                  <span className="text-stone-400 text-xs block mb-1">
                    Trades
                  </span>
                  <span className="text-white font-medium">
                    {selectedYearData.trade_count}
                  </span>
                </div>
                <div className="bg-stone-900/50 rounded-lg p-3">
                  <span className="text-stone-400 text-xs block mb-1">
                    USD Trades
                  </span>
                  <span className="text-green-400 font-medium">
                    {selectedYearData.usd_trades_count}
                  </span>
                </div>
                <div className="bg-stone-900/50 rounded-lg p-3">
                  <span className="text-stone-400 text-xs block mb-1">
                    INR Trades
                  </span>
                  <span className="text-amber-400 font-medium">
                    {selectedYearData.inr_trades_count}
                  </span>
                </div>
                <div className="bg-stone-900/50 rounded-lg p-3">
                  <span className="text-stone-400 text-xs block mb-1">
                    NET USD
                  </span>
                  <span className="text-white font-medium">
                    {formatCurrency(selectedYearData.total_usd_amount, "USD")}
                  </span>
                </div>
                <div className="bg-stone-900/50 rounded-lg p-3">
                  <span className="text-stone-400 text-xs block mb-1">
                    Converted USD
                  </span>
                  <span className="text-white font-medium">
                    {formatCurrency(
                      selectedYearData.total_usd_converted_to_inr
                    )}
                  </span>
                </div>
                <div className="bg-stone-900/50 rounded-lg p-3">
                  <span className="text-stone-400 text-xs block mb-1">
                    Direct INR
                  </span>
                  <span className="text-white font-medium">
                    {formatCurrency(selectedYearData.total_inr_amount)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-stone-900/50 rounded-lg p-3">
                  <span className="text-stone-400 text-xs block mb-1">
                    Combined INR (Total Value)
                  </span>
                  <span className="text-white font-medium text-lg">
                    {formatCurrency(selectedYearData.total_combined_inr)}
                  </span>
                </div>
                <div className="bg-stone-900/50 rounded-lg p-3">
                  <span className="text-stone-400 text-xs block mb-1">
                    Average Trade Value (INR)
                  </span>
                  <span className="text-white font-medium text-lg">
                    {formatCurrency(selectedYearData.average_trade_value_inr)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Monthly Breakdown */}
        <div className="bg-black/30 border border-stone-800 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-stone-400" />
              Monthly Breakdown
            </h2>
            {analytics.monthly_analytics.length > 0 && (
              <select
                value={selectedMonth || ""}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={`px-3 p-2 ${STONE_Button} text-stone-300 rounded-lg text-sm transition-colors cursor-pointer`}
              >
                {analytics.monthly_analytics.map((month) => (
                  <option key={month.month_code} value={month.month_code}>
                    {month.month} {month.year} ({month.trade_count} trades)
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedMonthData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-stone-900/50 rounded-lg p-3">
                  <span className="text-stone-400 text-xs block mb-1">
                    Trades
                  </span>
                  <span className="text-white font-medium">
                    {selectedMonthData.trade_count}
                  </span>
                </div>
                <div className="bg-stone-900/50 rounded-lg p-3">
                  <span className="text-stone-400 text-xs block mb-1">
                    NET USD
                  </span>
                  <span className="text-white font-medium">
                    {formatCurrency(selectedMonthData.total_usd_amount, "USD")}
                  </span>
                </div>
                <div className="bg-stone-900/50 rounded-lg p-3">
                  <span className="text-stone-400 text-xs block mb-1">
                    Converted USD
                  </span>
                  <span className="text-white font-medium">
                    {formatCurrency(
                      selectedMonthData.total_usd_converted_to_inr
                    )}
                  </span>
                </div>
                <div className="bg-stone-900/50 rounded-lg p-3">
                  <span className="text-stone-400 text-xs block mb-1">INR</span>
                  <span className="text-white font-medium">
                    {formatCurrency(selectedMonthData.total_inr_amount)}
                  </span>
                </div>
                <div className="bg-stone-900/50 rounded-lg p-3 col-span-2 sm:col-span-4">
                  <span className="text-stone-400 text-xs block mb-1">
                    Combined INR (Total Value)
                  </span>
                  <span className="text-white font-medium text-lg">
                    {formatCurrency(selectedMonthData.total_combined_inr)}
                  </span>
                </div>
              </div>

              {viewMode === "detailed" && (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {selectedMonthData.trades.map((trade) => (
                    <div
                      key={trade.id}
                      className="bg-stone-900/30 border border-stone-800 rounded-lg p-3 hover:border-stone-700 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-stone-500">
                            {formatDateTime(trade.date)}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              trade.currency === "usd"
                                ? "bg-green-900/30 text-green-400"
                                : "bg-amber-900/30 text-amber-400"
                            }`}
                          >
                            {trade.currency.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-white">
                          {formatCurrency(
                            trade.net_amount,
                            trade.currency === "usd" ? "USD" : "INR"
                          )}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {trade.conversion_rate && (
                          <div>
                            <span className="text-stone-500">Rate:</span>
                            <span className="ml-1 text-stone-300">
                              {trade.conversion_rate}
                            </span>
                          </div>
                        )}
                        {trade.usd_converted_to_inr && (
                          <div>
                            <span className="text-stone-500">USD → INR:</span>
                            <span className="ml-1 text-stone-300">
                              {formatCurrency(trade.usd_converted_to_inr)}
                            </span>
                          </div>
                        )}
                        {trade.traded_with && (
                          <div>
                            <span className="text-stone-500">With:</span>
                            <span className="ml-1 text-stone-300">
                              {trade.traded_with}
                            </span>
                          </div>
                        )}
                        {trade.rate && (
                          <div>
                            <span className="text-stone-500">Rate:</span>
                            <span className="ml-1 text-stone-300">
                              {trade.rate}
                            </span>
                          </div>
                        )}
                      </div>
                      {trade.note && (
                        <p className="text-xs text-stone-600 mt-2 italic">
                          {trade.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-blue-900/10 border border-blue-800/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-stone-400">
              <span className="text-blue-400 font-medium">Note:</span> This
              analytics data only reflects cross-trades recorded for this
              specific account. Ensure all trades are properly logged for
              accurate tracking.
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
