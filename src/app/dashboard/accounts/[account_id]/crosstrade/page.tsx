"use client";
import React from "react";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import PageWrapper from "../../../../(components)/PageWrapper";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  DollarSign,
  IndianRupee,
  User,
  Calendar,
  Loader2,
  Edit,
  ChevronDown,
  ChevronUp,
  X,
  Link as LinkIcon,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import getAxiosErrorMessage from "../../../../../utils/Variables/getAxiosError.util";
import { formatDateTime } from "../../../../../utils/main.util";
import {
  BLUE_Button,
  RED_Button,
  STONE_Button,
} from "../../../../../utils/CSS/Button.util";
import { CombinedResponse } from "../../../../api/dashboard/account/[account_id]/crosstrade/route";
import CrossTradeForm from "../../../../(components)/CrossTradeAddForm";

export interface ApiResponse {
  success: boolean;
  data: CombinedResponse;
}

export default function CrossTradeManager() {
  const { account_id } = useParams();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [data, setData] = useState<ApiResponse["data"] | null>(null);
  const [showNewTradeModal, setShowNewTradeModal] = useState<boolean>(false);
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchCrossTradeData = useCallback(async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `/api/dashboard/account/${account_id}/crosstrade`
      );

      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error: unknown) {
      toast.error(
        getAxiosErrorMessage(error, "Failed to load cross trade data")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [account_id]);

  useEffect(() => {
    fetchCrossTradeData();
  }, [fetchCrossTradeData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCrossTradeData();
  };

  const handleDeleteTrade = async (tradeId: string) => {
    // TODO: Implement edit
    toast.error("Delete feature coming soon");
    console.log(`${tradeId}`);
    // try {
    //   const response = await axios.delete(
    //     `/api/dashboard/account/${account_id}/crosstrade/${tradeId}`
    //   );

    //   if (response.data.success) {
    //     toast.success("Cross trade deleted successfully!");
    //     setDeleteConfirmId(null);
    //     fetchCrossTradeData();
    //   }
    // } catch (error: unknown) {
    //   toast.error(getAxiosErrorMessage(error, "Failed to delete cross trade"));
    // }
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
                href={`/dashboard/accounts/${account_id}`}
                className="p-2 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-5 w-5 text-stone-400" />
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-medium text-white">
                  Cross Trade Manager
                </h1>
                <p className="text-stone-400 text-sm">
                  Manage all cross trades for this account
                </p>
              </div>
            </div>

            <div className="flex justify-end flex-wrap gap-3">
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

              <button
                onClick={() => setShowNewTradeModal(true)}
                className={`px-4 py-2 ${BLUE_Button} text-white rounded-lg text-sm transition-colors cursor-pointer flex items-center gap-2`}
              >
                <Plus className="h-4 w-4" />
                New Crosstrade
              </button>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        {!loading && data?.cross_trade_logs.length && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-stone-900/50 border border-stone-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-stone-400 text-sm">Total Trades</p>
                  <p className="text-2xl font-medium text-white">
                    {data.cross_trade_logs.length}
                  </p>
                </div>
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
                <p className="text-stone-500 max-w-md mx-auto">
                  Start by creating your first cross trade record to track your
                  trading activities.
                </p>
              </div>
            ) : (
              <div className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-stone-800">
                        <th className="text-left p-4 text-stone-400 text-sm font-medium whitespace-nowrap">
                          ID
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
                                      trade.currency
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
                                        trade.currency
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
                                  trade.traded
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
                                  trade.paid
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
                              <td colSpan={11} className="p-0">
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
                                                trade.crosstrade_via
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
                                              {formatDateTime(trade.created_at)}
                                            </div>
                                          </div>
                                          <div>
                                            <div className="text-stone-400 mb-1">
                                              Updated
                                            </div>
                                            <div className="text-white ">
                                              {formatDateTime(trade.updated_at)}
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
                                                trade.currency
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
                                                  trade.currency
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
                                                      "inr"
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
                                        {trade.trade_link && (
                                          <Link
                                            href={trade.trade_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`px-3 py-1.5 ${BLUE_Button} text-white text-sm rounded transition-colors cursor-pointer flex items-center gap-2`}
                                          >
                                            <LinkIcon className="h-3 w-3" />
                                            Trade Link
                                          </Link>
                                        )}
                                        <button
                                          className={`px-3 py-1.5 ${BLUE_Button} text-white text-sm rounded transition-colors cursor-pointer flex items-center gap-2`}
                                          title="Edit"
                                          onClick={() => {
                                            // TODO: Implement edit
                                            toast.error(
                                              "Edit feature coming soon"
                                            );
                                          }}
                                        >
                                          <Edit className="h-3 w-3" />
                                          Edit
                                        </button>

                                        {deleteConfirmId === trade.id ? (
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={() =>
                                                handleDeleteTrade(trade.id)
                                              }
                                              className={`px-3 py-1.5 ${RED_Button} text-white text-sm rounded transition-colors cursor-pointer flex items-center gap-2`}
                                            >
                                              Confirm Delete
                                            </button>
                                            <button
                                              onClick={() =>
                                                setDeleteConfirmId(null)
                                              }
                                              className={`px-3 py-1.5 ${STONE_Button} text-white text-sm rounded transition-colors cursor-pointer flex items-center gap-2`}
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() =>
                                              setDeleteConfirmId(trade.id)
                                            }
                                            className={`px-3 py-1.5 ${RED_Button} text-white text-sm rounded transition-colors cursor-pointer flex items-center gap-2`}
                                            title="Delete"
                                          >
                                            <X className="h-3 w-3" />
                                            Delete
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
            )}
          </>
        )}
      </div>
      {showNewTradeModal && (
        <CrossTradeForm
          accountId={account_id as string}
          onClose={() => setShowNewTradeModal(false)}
          onSuccess={fetchCrossTradeData}
          bot_associated={data?.bot_associated || []}
        />
      )}
    </PageWrapper>
  );
}
