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
  ArrowRightLeft,
  User,
  ChevronDown,
  ChevronUp,
  Loader2,
  Link as LinkIcon,
  X,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import getAxiosErrorMessage from "../../../../../utils/Variables/getAxiosError.util";
import { formatDateTime } from "../../../../../utils/main.util";
import {
  BLUE_Button,
  ORANGE_Button,
  RED_Button,
  STONE_Button,
} from "../../../../../utils/CSS/Button.util";
import Loader from "../../../../(components)/Loader";
import CurrencyCrossTradeModal from "../../../../(components)/Crosstrade/CurrencyCrossTradeModal";
import { CurrencyCrossTrade } from "../../../../api/dashboard/account/[account_id]/currency-crosstrade/route";

interface ApiResponse {
  success: boolean;
  data: CurrencyCrossTrade[];
}

export default function CurrencyCrossTradeManager() {
  const { account_id } = useParams();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [trades, setTrades] = useState<CurrencyCrossTrade[]>([]);
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isCurrencyTradeModalOpen, setIsCurrencyTradeModalOpen] =
    useState<boolean>(false);
  const [accountName, setAccountName] = useState<string>("");

  const fetchTrades = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get<ApiResponse>(
        `/api/dashboard/account/${account_id}/currency-crosstrade`
      );
      if (response.data.success) {
        setTrades(response.data.data);
      }
    } catch (error: unknown) {
      toast.error(
        getAxiosErrorMessage(error, "Failed to load currency crosstrades")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [account_id]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  useEffect(() => {
    const fetchAccountName = async () => {
      if (!account_id) return;
      try {
        const res = await axios.get(`/api/dashboard/account/${account_id}`);
        if (res.data.success) setAccountName(res.data.data.name);
      } catch {
        setAccountName(String(account_id));
      }
    };
    fetchAccountName();
  }, [account_id]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTrades();
  };

  const handleDeleteTrade = async (tradeId: string) => {
    // TODO: Implement delete
    toast.error("Delete feature coming soon");
    console.log(`${tradeId}`);
  };

  const toggleExpand = (tradeId: string) => {
    setExpandedTradeId(expandedTradeId === tradeId ? null : tradeId);
  };

  return (
    <PageWrapper withSidebar sidebarRole="user">
      <div className="min-h-screen p-4 md:p-6">
        {/* Currency Crosstrade Modal */}
        <CurrencyCrossTradeModal
          isOpen={isCurrencyTradeModalOpen}
          onClose={() => setIsCurrencyTradeModalOpen(false)}
          onSuccess={() => fetchTrades()}
          currentAccountId={String(account_id)}
          currentAccountName={accountName}
        />

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
                  Currency Crosstrade
                </h1>
                <p className="text-stone-400 text-sm">
                  Track in-game currency exchanges between bots
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
                onClick={() => setIsCurrencyTradeModalOpen(true)}
                className={`px-4 py-2 ${ORANGE_Button} text-white rounded-lg text-sm transition-colors cursor-pointer flex items-center gap-2`}
              >
                <Plus className="h-4 w-4" />
                New Crosstrade
              </button>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        {!loading && trades.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-stone-900/50 border border-stone-800 rounded-lg p-4">
              <p className="text-stone-400 text-sm">Total Trades</p>
              <p className="text-2xl font-medium text-white">{trades.length}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <Loader />
        ) : (
          <>
            {/* Empty State */}
            {trades.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-stone-700 rounded-lg">
                <ArrowRightLeft className="h-12 w-12 text-stone-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-stone-300 mb-2">
                  No currency crosstrades found
                </h3>
                <p className="text-stone-500 max-w-md mx-auto">
                  Start by creating your first currency crosstrade to track
                  in-game currency exchanges between bots.
                </p>
              </div>
            ) : (
              <div className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden select-text">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-stone-800">
                        <th className="text-left p-4 text-stone-400 text-sm font-medium whitespace-nowrap">
                          ID
                        </th>
                        <th className="text-left p-4 text-stone-400 text-sm font-medium whitespace-nowrap">
                          FROM
                        </th>
                        <th className="text-center p-4 text-stone-400 text-sm font-medium whitespace-nowrap">
                          GIVING
                        </th>
                        <th className="text-left p-4 text-stone-400 text-sm font-medium whitespace-nowrap">
                          TO
                        </th>
                        <th className="text-center p-4 text-stone-400 text-sm font-medium whitespace-nowrap">
                          RECEIVING
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
                      {trades.map((trade) => (
                        <React.Fragment key={trade.id}>
                          {/* Main Table Row */}
                          <tr className="border-t border-stone-800 hover:bg-stone-900/30 transition-colors text-xs">
                            {/* ID */}
                            <td className="p-4">
                              <span className="text-stone-400 font-mono">
                                #{trade.id}
                              </span>
                            </td>

                            {/* FROM */}
                            <td className="p-4">
                              <span className="text-white font-medium">
                                {trade.from_bot_name}
                              </span>
                            </td>

                            {/* GIVING (from amount + currency) */}
                            <td className="p-4 text-center">
                              <span
                                className={`flex items-center justify-center gap-1 px-2 py-1 rounded-full border text-xs font-medium text-nowrap w-full text-center bg-red-600/20 text-red-400 border-red-800`}
                              >
                                {trade.from_amount} {trade.from_currency_name}
                              </span>
                            </td>

                            {/* TO */}
                            <td className="p-4">
                              <span className="text-white font-medium">
                                {trade.to_bot_name}
                              </span>
                            </td>

                            {/* RECEIVING (to amount + currency) */}
                            <td className="p-4 text-center">
                              <span
                                className={`flex items-center justify-center gap-1 px-2 py-1 rounded-full border text-xs font-medium text-nowrap w-full text-center bg-green-600/20 text-green-400 border-green-800`}
                              >
                                {trade.to_amount} {trade.to_currency_name}
                              </span>
                            </td>

                            {/* TRADED WITH */}
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

                          {/* Expanded Details Row */}
                          {expandedTradeId === trade.id && (
                            <tr className="bg-black/20 border-b border-stone-800">
                              <td colSpan={8} className="p-0">
                                <div className="p-6 border-t border-stone-800">
                                  <div className="flex flex-wrap items-start justify-between gap-6">
                                    {/* Meta & Actions */}
                                    <div className="flex-1 space-y-3 bg-black/20 p-3 rounded-lg border border-stone-800">
                                      <h4 className="text-sm font-medium text-stone-300">
                                        Details
                                      </h4>
                                      <div className="space-y-2 text-xs">
                                        <div>
                                          <div className="text-stone-400 mb-1">
                                            Traded With
                                          </div>
                                          <div className="text-white">
                                            {trade.traded_with || "--"}
                                          </div>
                                        </div>
                                        <div>
                                          <div className="text-stone-400 mb-1">
                                            Note
                                          </div>
                                          <div className="text-white italic">
                                            {trade.note
                                              ? `" ${trade.note} "`
                                              : "--"}
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
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
                                            <div className="text-white">
                                              {formatDateTime(trade.updated_at)}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex-1 space-y-3 md:col-span-2 lg:col-span-3">
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
                                            className={`px-3 py-1.5 bg-blue-800 text-white text-sm rounded cursor-not-allowed flex items-center gap-2 opacity-50`}
                                          >
                                            <LinkIcon className="h-3 w-3" />
                                            No Trade Link
                                          </button>
                                        )}

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
    </PageWrapper>
  );
}
