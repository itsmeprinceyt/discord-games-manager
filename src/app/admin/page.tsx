"use client";
import React, { useState, useEffect } from "react";
import {
  Users,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Shield,
} from "lucide-react";
import axios from "axios";
import type {
  AdminDashboardResponse,
  AuditLog,
} from "../../types/DTO/Audit.DTO";
import PageWrapper from "../(components)/PageWrapper";
import getAxiosErrorMessage from "../../utils/Variables/getAxiosError.util";
import toast from "react-hot-toast";
import { formatDate, formatDateTime } from "../../utils/main.util";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_users: 0,
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<AdminDashboardResponse>(
        "/api/admin/dashboard"
      );

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

  const formatTotalUsers = (count: number) => {
    return count.toLocaleString();
  };

  const getActionIcon = (actionType: AuditLog["action_type"]) => {
    switch (actionType) {
      case "user_signup":
      case "user_update":
        return <UserPlus className="h-4 w-4" />;
      case "user_ban":
      case "user_unban":
      case "admin_action":
        return <Shield className="h-4 w-4" />;
      case "system":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getActionStatus = (actionType: AuditLog["action_type"]) => {
    switch (actionType) {
      case "user_ban":
      case "game_account_delete":
        return "error";
      case "user_signup":
      case "user_unban":
      case "game_account_create":
        return "success";
      case "user_update":
      case "game_account_update":
        return "warning";
      default:
        return "success";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-400";
      case "warning":
        return "text-amber-400";
      case "error":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-900/20";
      case "warning":
        return "bg-amber-900/20";
      case "error":
        return "bg-red-900/20";
      default:
        return "bg-gray-900/20";
    }
  };

  const formatActionType = (actionType: AuditLog["action_type"]) => {
    return actionType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <PageWrapper withSidebar sidebarRole="admin">
      <div className="min-h-screen p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-medium text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-stone-400 text-sm">
            Welcome back, Administrator. Here&apos;s what&apos;s happening with
            your platform.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Total Users Card */}
              <div className="bg-black/30 border border-stone-800 rounded-lg p-6 hover:border-stone-700 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-lg bg-blue-600/20">
                    <Users className="text-blue-400 h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-2xl font-medium text-white mb-1">
                  {formatTotalUsers(stats.total_users)}
                </h3>
                <p className="text-stone-400 text-sm">Total Users</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-black/30 border border-stone-800 rounded-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <h2 className="text-lg sm:text-xl font-medium text-white">
                  Recent Activity
                </h2>
                <span className="text-stone-400 text-xs sm:text-sm">
                  Showing latest {auditLogs.length} activities
                </span>
              </div>

              {auditLogs.length === 0 ? (
                <div className="text-center py-8 text-stone-500 text-sm sm:text-base">
                  No recent activity found
                </div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => {
                    const status = getActionStatus(log.action_type);
                    return (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 sm:p-4 bg-stone-900/30 rounded border border-stone-800 hover:border-stone-700 transition-colors"
                      >
                        <div className="flex items-start space-x-3 w-full">
                          <div
                            className={`p-2 rounded shrink-0 ${getStatusBg(
                              status
                            )} ${getStatusColor(status)}`}
                          >
                            {getActionIcon(log.action_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-white text-sm">
                              <div className=" text-sm sm:text-base wrap-break-word">
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
                                  className={`rounded p-1 text-xs ${getStatusBg(
                                    status
                                  )} ${getStatusColor(
                                    status
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
