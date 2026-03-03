"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Calendar,
  User,
  Mail,
  Hash,
  Shield,
  AlertCircle,
  CheckCircle,
  UserPlus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import axios from "axios";
import type { AuditLog, AuditLogsResponse } from "../../../types/DTO/Audit.DTO";
import PageWrapper from "../../(components)/PageWrapper";
import getAxiosErrorMessage from "../../../utils/Variables/getAxiosError.util";
import toast from "react-hot-toast";
import { formatDate, formatDateTime } from "../../../utils/main.util";
import Loader from "../../(components)/Loader";
import { BLUE_Button, STONE_Button } from "../../../utils/CSS/Button.util";

const ACTION_TYPES = [
  { value: "", label: "All Actions" },
  { value: "user_signup", label: "User Signup" },
  { value: "user_update", label: "User Update" },
  { value: "user_ban", label: "User Ban" },
  { value: "user_unban", label: "User Unban" },
  { value: "game_account_create", label: "Game Account Create" },
  { value: "game_account_update", label: "Game Account Update" },
  { value: "game_account_delete", label: "Game Account Delete" },
  { value: "system", label: "System" },
  { value: "admin_action", label: "Admin Action" },
  { value: "user_action", label: "User Action" },
  { value: "crosstrade_entry", label: "Crosstrade Entry" },
  { value: "crosstrade_update", label: "Crosstrade Update" },
  { value: "wallet_update", label: "Wallet Update" },
  { value: "vote_trigger", label: "Vote Trigger" },
];

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [pagination, setPagination] = useState({
    current_page: 1,
    items_per_page: 20,
    total_items: 0,
    total_pages: 0,
    has_next: false,
    has_previous: false,
  });

  const [filters, setFilters] = useState({
    userId: "",
    email: "",
    username: "",
    action: "",
    fromDate: "",
    toDate: "",
  });

  const toggleLogExpansion = (logId: string) => {
    setExpandedLogs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const fetchLogs = useCallback(
    async (page: number, filterParams = filters) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", pagination.items_per_page.toString());

        if (filterParams.userId) params.append("userId", filterParams.userId);
        if (filterParams.email) params.append("email", filterParams.email);
        if (filterParams.username)
          params.append("username", filterParams.username);
        if (filterParams.action) params.append("action", filterParams.action);
        if (filterParams.fromDate)
          params.append("fromDate", filterParams.fromDate);
        if (filterParams.toDate) params.append("toDate", filterParams.toDate);

        const response = await axios.get<AuditLogsResponse>(
          `/api/admin/audit-logs?${params.toString()}`
        );

        if (response.data.success) {
          setLogs(response.data.data.logs);
          setPagination(response.data.data.pagination);
          setExpandedLogs(new Set());
        }
      } catch (err: unknown) {
        const message = getAxiosErrorMessage(err, "Error fetching audit logs");
        toast.error(message);
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.items_per_page]
  );

  const handleSearch = (
    field: "userId" | "email" | "username",
    value: string
  ) => {
    const updatedFilters = { ...filters, [field]: value };
    setFilters(updatedFilters);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      fetchLogs(1, updatedFilters);
    }, 500);
  };

  const handleFilterChange = (field: string, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    fetchLogs(1, newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      userId: "",
      email: "",
      username: "",
      action: "",
      fromDate: "",
      toDate: "",
    };
    setFilters(emptyFilters);
    fetchLogs(1, emptyFilters);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchLogs(newPage);
    }
  };

  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newLimit = parseInt(e.target.value);
    setPagination((prev) => ({ ...prev, items_per_page: newLimit }));
    fetchLogs(1);
  };

  useEffect(() => {
    fetchLogs(1);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [fetchLogs]);

  const getActionIcon = (actionType: AuditLog["action_type"]) => {
    switch (actionType) {
      case "user_signup":
        return <UserPlus className="h-4 w-4" />;
      case "user_update":
        return <User className="h-4 w-4" />;
      case "user_ban":
      case "user_unban":
      case "admin_action":
        return <Shield className="h-4 w-4" />;
      case "game_account_create":
      case "game_account_update":
      case "game_account_delete":
        return <Hash className="h-4 w-4" />;
      case "crosstrade_entry":
      case "crosstrade_update":
      case "wallet_update":
      case "vote_trigger":
        return <RefreshCw className="h-4 w-4" />;
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
      case "crosstrade_update":
      case "wallet_update":
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
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-medium text-white mb-2">
            Audit Logs
          </h1>
          <p className="text-stone-400 text-sm">
            View and search all system activities and user actions
          </p>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-500" />
              <input
                type="text"
                placeholder="Search by User ID..."
                value={filters.userId}
                onChange={(e) => handleSearch("userId", e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black/30 border border-stone-800 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:border-stone-600 transition-colors"
              />
            </div>
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-500" />
              <input
                type="text"
                placeholder="Search by Email..."
                value={filters.email}
                onChange={(e) => handleSearch("email", e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black/30 border border-stone-800 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:border-stone-600 transition-colors"
              />
            </div>
            <div className="flex-1 relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-500" />
              <input
                type="text"
                placeholder="Search by Username..."
                value={filters.username}
                onChange={(e) => handleSearch("username", e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black/30 border border-stone-800 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:border-stone-600 transition-colors"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                showFilters
                  ? "bg-stone-700 border-stone-600 text-white"
                  : "border-stone-800 text-stone-400 hover:bg-stone-900"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="bg-black/30 border border-stone-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">Advanced Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-stone-400 hover:text-white transition-colors text-sm flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Clear all
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-stone-400 text-xs mb-1">
                    Action Type
                  </label>
                  <select
                    value={filters.action}
                    onChange={(e) =>
                      handleFilterChange("action", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-black/30 border border-stone-800 rounded-lg text-white focus:outline-none focus:border-stone-600 transition-colors"
                  >
                    {ACTION_TYPES.map((action) => (
                      <option key={action.value} value={action.value}>
                        {action.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-stone-400 text-xs mb-1">
                    From Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-500" />
                    <input
                      type="date"
                      value={filters.fromDate}
                      onChange={(e) =>
                        handleFilterChange("fromDate", e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-2 bg-black/30 border border-stone-800 rounded-lg text-white focus:outline-none focus:border-stone-600 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-stone-400 text-xs mb-1">
                    To Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-500" />
                    <input
                      type="date"
                      value={filters.toDate}
                      onChange={(e) =>
                        handleFilterChange("toDate", e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-2 bg-black/30 border border-stone-800 rounded-lg text-white focus:outline-none focus:border-stone-600 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-stone-400 text-sm">
            Showing {logs.length} of {pagination.total_items} logs
          </div>
          <div className="flex items-center gap-3">
            <label className="text-stone-400 text-sm">Show:</label>
            <select
              value={pagination.items_per_page}
              onChange={handleItemsPerPageChange}
              className="px-3 py-1 bg-black/30 border border-stone-800 rounded-lg text-white text-sm focus:outline-none focus:border-stone-600 transition-colors"
            >
              {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && <Loader />}

        {error && !loading && (
          <div className="mb-8 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-red-400">Error: {error}</p>
            <button
              onClick={() => fetchLogs(pagination.current_page)}
              className="mt-2 px-4 py-2 bg-red-800 hover:bg-red-700 rounded text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="bg-black/30 border border-stone-800 rounded-lg overflow-hidden">
              {logs.length === 0 ? (
                <div className="text-center py-12 text-stone-500 text-sm sm:text-base">
                  No audit logs found
                </div>
              ) : (
                <div className="divide-y divide-stone-800 select-text">
                  {logs.map((log) => {
                    const status = getActionStatus(log.action_type);
                    const isExpanded = expandedLogs.has(log.id);

                    return (
                      <div
                        key={log.id}
                        className="p-4 hover:bg-stone-900/30 transition-colors"
                        onClick={() => toggleLogExpansion(log.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className={`p-2 rounded shrink-0 ${getStatusBg(
                              status
                            )} ${getStatusColor(status)}`}
                          >
                            {getActionIcon(log.action_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="text-white text-sm sm:text-base wrap-break-word">
                                  {log.description ||
                                    formatActionType(log.action_type)}
                                  {log.performed_at && (
                                    <span className="ml-1 text-xs text-stone-600">
                                      ({formatDate(log.performed_at)})
                                    </span>
                                  )}
                                </div>
                                {log.meta &&
                                  Object.keys(log.meta).length > 0 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleLogExpansion(log.id);
                                      }}
                                      className="p-1 rounded hover:bg-stone-800 transition-colors cursor-pointer"
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="h-4 w-4 text-stone-400" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4 text-stone-400" />
                                      )}
                                    </button>
                                  )}
                              </div>
                              <span
                                className={`inline-flex items-center rounded px-2 py-1 text-xs ${getStatusBg(
                                  status
                                )} ${getStatusColor(status)} whitespace-nowrap`}
                              >
                                {formatActionType(log.action_type)}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-stone-500 text-xs mt-2">
                              {log.actor_name && (
                                <>
                                  <span className="text-stone-400">Actor:</span>
                                  <span>{log.actor_name}</span>
                                </>
                              )}
                              {log.actor_email && (
                                <>
                                  <span className="text-stone-600">•</span>
                                  <span>{log.actor_email}</span>
                                </>
                              )}
                              {log.target_user_id && (
                                <>
                                  <span className="text-stone-600">•</span>
                                  <span className="text-stone-400">
                                    Target:
                                  </span>
                                  <span className="font-mono">
                                    {log.target_user_id}
                                  </span>
                                </>
                              )}
                              {log.performed_at && (
                                <>
                                  <span className="text-stone-600">•</span>
                                  <span>
                                    {formatDateTime(log.performed_at)}
                                  </span>
                                </>
                              )}
                            </div>

                            {isExpanded &&
                              log.meta &&
                              Object.keys(log.meta).length > 0 && (
                                <div
                                  className="mt-3 overflow-hidden transition-all duration-300 ease-in-out select-text cursor-text"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="p-3 bg-stone-900/50 rounded border border-stone-800 animate-slideDown">
                                    <h4 className="text-xs font-medium text-stone-400 mb-2">
                                      Meta Data
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                                      {Object.entries(log.meta).map(
                                        ([key, value]) => (
                                          <div
                                            key={key}
                                            className="flex flex-col"
                                          >
                                            <span className="text-stone-500">
                                              {key}:
                                            </span>
                                            <span className="text-stone-300 break-all">
                                              {typeof value === "object"
                                                ? JSON.stringify(value)
                                                : String(value)}
                                            </span>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
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

            {pagination.total_pages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-stone-400">
                  Page {pagination.current_page} of {pagination.total_pages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={!pagination.has_previous}
                    className={`p-2 rounded-lg ${STONE_Button} text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer`}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() =>
                      handlePageChange(pagination.current_page - 1)
                    }
                    disabled={!pagination.has_previous}
                    className={`p-2 rounded-lg ${STONE_Button} text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, pagination.total_pages))].map(
                      (_, i) => {
                        let pageNum = pagination.current_page;
                        if (pagination.total_pages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.current_page <= 3) {
                          pageNum = i + 1;
                        } else if (
                          pagination.current_page >=
                          pagination.total_pages - 2
                        ) {
                          pageNum = pagination.total_pages - 4 + i;
                        } else {
                          pageNum = pagination.current_page - 2 + i;
                        }

                        return (
                          <button
                            key={i}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-8 h-8 rounded-lg text-sm transition-colors cursor-pointer ${
                              pagination.current_page === pageNum
                                ? `${BLUE_Button} text-white`
                                : `${STONE_Button} border border-stone-800 text-stone-400`
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                    )}
                  </div>

                  <button
                    onClick={() =>
                      handlePageChange(pagination.current_page + 1)
                    }
                    disabled={!pagination.has_next}
                    className={`p-2 rounded-lg ${STONE_Button} text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.total_pages)}
                    disabled={!pagination.has_next}
                    className={`p-2 rounded-lg ${STONE_Button} text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer`}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  );
}
