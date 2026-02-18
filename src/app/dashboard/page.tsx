/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import { Bot, RefreshCw, User, TrendingUp, History } from "lucide-react";
import axios from "axios";
import PageWrapper from "../(components)/PageWrapper";
import getAxiosErrorMessage from "../../utils/Variables/getAxiosError.util";
import toast from "react-hot-toast";
import { formatDate, formatDateTime } from "../../utils/main.util";
import Loader from "../(components)/Loader";

interface AuditLog {
  id: string;
  action_type: string;
  actor_user_id: string;
  target_user_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  description: string | null;
  meta: any;
  performed_at: string;
}

interface UserDashboardResponse {
  success: boolean;
  data: {
    stats: {
      total_accounts: number;
      total_trades: number;
    };
    auditLogs: AuditLog[];
  };
}

export default function UserDashboard() {
  const [stats, setStats] = useState({
    total_accounts: 0,
    total_trades: 0,
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [autoVoteLoading, setAutoVoteLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<UserDashboardResponse>("/api/dashboard");

      if (response.data.success) {
        setStats(response.data.data.stats);
        setAuditLogs(response.data.data.auditLogs);
      }
    } catch (err: unknown) {
      const message = getAxiosErrorMessage(
        err,
        "Error fetching dashboard data"
      );
      toast.error(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoVote = async () => {
    try {
      setAutoVoteLoading(true);
      const response = await axios.post("/api/dashboard/vote-all");

      if (response.data.success) {
        toast.success(response.data.message);
        fetchDashboardData();
      } else {
        toast.error(response.data.error || "Failed to trigger auto-vote");
      }
    } catch (err: unknown) {
      const message = getAxiosErrorMessage(err, "Error triggering auto-vote");
      toast.error(message);
    } finally {
      setAutoVoteLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "user_signup":
      case "user_update":
        return <User className="h-4 w-4" />;
      case "game_account_create":
      case "game_account_update":
      case "game_account_delete":
        return <Bot className="h-4 w-4" />;
      case "user_action":
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case "user_signup":
      case "game_account_create":
        return "text-green-400";
      case "user_update":
      case "game_account_update":
        return "text-blue-400";
      case "game_account_delete":
        return "text-red-400";
      default:
        return "text-stone-400";
    }
  };

  const getActionBg = (actionType: string) => {
    switch (actionType) {
      case "user_signup":
      case "game_account_create":
        return "bg-green-900/20";
      case "user_update":
      case "game_account_update":
        return "bg-blue-900/20";
      case "game_account_delete":
        return "bg-red-900/20";
      default:
        return "bg-stone-900/20";
    }
  };

  const formatActionType = (actionType: string) => {
    return actionType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <PageWrapper withSidebar sidebarRole="user">
      <div className="min-h-screen p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-medium text-white mb-2">
            Dashboard
          </h1>
          <p className="text-stone-400 text-sm">
            Welcome back! Here&apos;s your activity overview.
          </p>
        </div>

        {/* Loading State */}
        {loading && <Loader />}

        {/* Error State */}
        {error && !loading && (
          <div className="mb-8 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-red-400">Error: {error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-2 px-4 py-2 bg-red-800 hover:bg-red-700 rounded text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats Grid */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Total Accounts Card */}
              <div className="bg-black/30 border border-stone-800 rounded-lg p-6 hover:border-stone-700 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-lg bg-blue-600/20">
                    <User className="text-blue-400 h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-2xl font-medium text-white mb-1">
                  {stats.total_accounts}
                </h3>
                <p className="text-stone-400 text-sm">Total Accounts</p>
              </div>

              {/* Total Trades Card */}
              <div className="bg-black/30 border border-stone-800 rounded-lg p-6 hover:border-stone-700 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-lg bg-green-600/20">
                    <TrendingUp className="text-green-400 h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-2xl font-medium text-white mb-1">
                  {stats.total_trades}
                </h3>
                <p className="text-stone-400 text-sm">Total Trades</p>
              </div>

              <div className="bg-black/30 border border-stone-800 rounded-lg p-6 hover:border-stone-700 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-lg bg-purple-600/20">
                    <RefreshCw className="text-purple-400 h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-2xl font-medium text-white mb-1">Vote</h3>
                <p className="text-stone-400 text-sm mb-3">
                  Add rewards to all bots
                </p>
                <button
                  onClick={handleAutoVote}
                  disabled={autoVoteLoading}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      autoVoteLoading ? "animate-spin" : ""
                    }`}
                  />
                  {autoVoteLoading ? "Processing..." : "Trigger Auto Vote"}
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-black/30 border border-stone-800 rounded-lg p-4 sm:p-6 select-text">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <h2 className="text-lg sm:text-xl font-medium text-white">
                  Recent Activity
                </h2>
                <span className="text-stone-400 text-xs sm:text-sm">
                  Showing your latest {auditLogs.length} activities
                </span>
              </div>

              {auditLogs.length === 0 ? (
                <div className="text-center py-8 text-stone-500 text-sm sm:text-base">
                  No recent activity found
                </div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => {
                    return (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 sm:p-4 bg-stone-900/30 rounded border border-stone-800 hover:border-stone-700 transition-colors"
                      >
                        <div className="flex items-start space-x-3 w-full">
                          <div
                            className={`p-2 rounded shrink-0 ${getActionBg(
                              log.action_type
                            )} ${getActionColor(log.action_type)}`}
                          >
                            {getActionIcon(log.action_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-white text-sm">
                              <div className="text-sm sm:text-base wrap-break-word">
                                {log.description ||
                                  formatActionType(log.action_type)}

                                {log.performed_at && (
                                  <span className="ml-1 text-xs text-stone-600">
                                    ({formatDate(log.performed_at)})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center">
                                <span
                                  className={`rounded p-1 text-xs ${getActionBg(
                                    log.action_type
                                  )} ${getActionColor(
                                    log.action_type
                                  )} whitespace-nowrap`}
                                >
                                  {formatActionType(log.action_type)}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-stone-500 text-xs mt-2">
                              •
                              {log.actor_name && (
                                <span className="truncate max-w-full sm:max-w-30">
                                  {log.actor_name}
                                </span>
                              )}
                              •
                              {log.actor_email && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <span className="truncate max-w-full sm:max-w-45">
                                    {log.actor_email}
                                  </span>
                                </>
                              )}
                              •
                              {log.performed_at && (
                                <span>{formatDateTime(log.performed_at)}</span>
                              )}
                            </div>

                            {log.meta && Object.keys(log.meta).length > 0 && (
                              <div className="text-xs text-stone-600 mt-2 flex flex-wrap gap-1 sm:gap-2">
                                {Object.entries(log.meta).map(
                                  ([key, value]) => (
                                    <React.Fragment key={key}>
                                      •
                                      <span className="break-all">
                                        <span className="font-medium">
                                          {key}:
                                        </span>{" "}
                                        {String(value)}
                                      </span>
                                    </React.Fragment>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </PageWrapper>
  );
}
