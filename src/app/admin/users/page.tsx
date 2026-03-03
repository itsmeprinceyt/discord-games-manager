"use client";
import React, { useState, useEffect, useCallback } from "react";
import PageWrapper from "../../(components)/PageWrapper";
import {
  Users,
  User,
  Mail,
  Shield,
  Calendar,
  RefreshCw,
  Loader2,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Bot,
  Hash,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import getAxiosErrorMessage from "../../../utils/Variables/getAxiosError.util";
import { formatDate } from "../../../utils/main.util";
import { BLUE_Button, STONE_Button } from "../../../utils/CSS/Button.util";
import Loader from "../../(components)/Loader";
import type {
  UsersWithBotStatsResponse,
  BotAccount,
} from "../../../types/DTO/User.DTO";

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function UsersWithBotsPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [data, setData] = useState<UsersWithBotStatsResponse["data"] | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    username: string;
    bot_accounts: BotAccount[];
  } | null>(null);
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(
    null
  );

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());

      const response = await axios.get<UsersWithBotStatsResponse>(
        `/api/admin/user-manager?${params.toString()}`
      );

      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err: unknown) {
      const message = getAxiosErrorMessage(err, "Failed to load users data");
      toast.error(message);
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value);
    setPagination({ page: 1, limit: newLimit });
  };

  const openBotAccountsModal = (user: {
    id: string;
    username: string;
    bot_accounts: BotAccount[];
  }) => {
    setSelectedUser(user);
    setExpandedAccountId(null);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setExpandedAccountId(null);
  };

  const toggleAccountExpand = (accountId: string) => {
    setExpandedAccountId(expandedAccountId === accountId ? null : accountId);
  };

  const getAdminBadge = (isAdmin: boolean) => {
    if (isAdmin) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-900/30 text-purple-400 rounded-full border border-purple-800 text-xs">
          <Shield className="h-3 w-3" />
          Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-stone-900/30 text-stone-400 rounded-full border border-stone-800 text-xs">
        <User className="h-3 w-3" />
        User
      </span>
    );
  };

  return (
    <PageWrapper withSidebar sidebarRole="admin">
      <div className="min-h-screen p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-medium text-white mb-2">
                Users
              </h1>
              <p className="text-stone-400 text-sm">View all users</p>
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
            </div>
          </div>
        </div>

        {/* Items per page selector */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-stone-400 text-sm">
            {data && (
              <>
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(
                  pagination.page * pagination.limit,
                  data.pagination.total_items
                )}{" "}
                of {data.pagination.total_items} users
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <label className="text-stone-400 text-sm">Show:</label>
            <select
              value={pagination.limit}
              onChange={handleLimitChange}
              className="px-3 py-1 bg-black/30 border border-stone-800 rounded-lg text-white text-sm focus:outline-none focus:border-stone-600 transition-colors cursor-pointer"
            >
              {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} per page
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <Loader text="Loading users data..." />
        ) : error ? (
          <div className="mb-8 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-red-400">Error: {error}</p>
            <button
              onClick={handleRefresh}
              className="mt-2 px-4 py-2 bg-red-800 hover:bg-red-700 rounded text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Empty State */}
            {data?.users.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-stone-700 rounded-lg">
                <Users className="h-12 w-12 text-stone-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-stone-300 mb-2">
                  No users found
                </h3>
                <p className="text-stone-500 max-w-md mx-auto">
                  There are no users in the system yet.
                </p>
              </div>
            ) : (
              <>
                {/* Users Grid/Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data?.users.map((user) => (
                    <div
                      key={user.id}
                      className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden hover:border-stone-700 transition-colors"
                    >
                      {/* User Header */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-600/20 rounded-lg">
                              <User className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                              <h3 className="text-white font-medium">
                                @{user.username}
                              </h3>
                              <div className="flex items-center gap-1 text-xs text-stone-500 mt-0.5">
                                <Hash className="h-3 w-3" />
                                <span className="font-mono">{user.id}</span>
                              </div>
                            </div>
                          </div>
                          {getAdminBadge(user.is_admin)}
                        </div>

                        {/* User Email */}
                        <div className="flex items-center gap-2 text-sm text-stone-400 mt-2">
                          <Mail className="h-4 w-4 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>

                        {/* Created Date */}
                        <div className="flex items-center gap-2 text-xs text-stone-500 mt-2">
                          <Calendar className="h-3 w-3" />
                          <span>Joined {formatDate(user.created_at)}</span>
                          {user.updated_at && (
                            <>
                              <span>•</span>
                              <span>Updated {formatDate(user.updated_at)}</span>
                            </>
                          )}
                        </div>

                        {/* View Bots Button */}
                        <div className="mt-4">
                          <button
                            onClick={() =>
                              openBotAccountsModal({
                                id: user.id,
                                username: user.username,
                                bot_accounts: user.bot_accounts,
                              })
                            }
                            className={`w-full px-3 py-2 ${BLUE_Button} text-white text-sm rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2`}
                          >
                            <Bot className="h-4 w-4" />
                            View Bot Accounts ({user.bot_accounts.length})
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {data && data.pagination.total_pages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-stone-400">
                      Page {data.pagination.current_page} of{" "}
                      {data.pagination.total_pages}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={!data.pagination.has_previous}
                        className={`p-2 rounded-lg ${STONE_Button} text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer`}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          handlePageChange(data.pagination.current_page - 1)
                        }
                        disabled={!data.pagination.has_previous}
                        className={`p-2 rounded-lg ${STONE_Button} text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer`}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      <div className="flex items-center gap-1">
                        {[
                          ...Array(Math.min(5, data.pagination.total_pages)),
                        ].map((_, i) => {
                          let pageNum = data.pagination.current_page;
                          if (data.pagination.total_pages <= 5) {
                            pageNum = i + 1;
                          } else if (data.pagination.current_page <= 3) {
                            pageNum = i + 1;
                          } else if (
                            data.pagination.current_page >=
                            data.pagination.total_pages - 2
                          ) {
                            pageNum = data.pagination.total_pages - 4 + i;
                          } else {
                            pageNum = data.pagination.current_page - 2 + i;
                          }

                          return (
                            <button
                              key={i}
                              onClick={() => handlePageChange(pageNum)}
                              className={`w-8 h-8 rounded-lg text-sm transition-colors cursor-pointer ${
                                data.pagination.current_page === pageNum
                                  ? `${BLUE_Button} text-white`
                                  : `${STONE_Button} border border-stone-800 text-stone-400`
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() =>
                          handlePageChange(data.pagination.current_page + 1)
                        }
                        disabled={!data.pagination.has_next}
                        className={`p-2 rounded-lg ${STONE_Button} text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer`}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          handlePageChange(data.pagination.total_pages)
                        }
                        disabled={!data.pagination.has_next}
                        className={`p-2 rounded-lg ${STONE_Button} text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer`}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Bot Accounts Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-stone-950 border border-stone-800 rounded-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-stone-800">
                <div>
                  <h2 className="text-xl font-medium text-white">
                    Bot Accounts - @{selectedUser.username}
                  </h2>
                  <p className="text-sm text-stone-400 mt-1">
                    {selectedUser.bot_accounts.length} bot account
                    {selectedUser.bot_accounts.length !== 1 ? "s" : ""} found
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5 text-stone-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                {selectedUser.bot_accounts.length === 0 ? (
                  <div className="text-center py-12">
                    <Bot className="h-12 w-12 text-stone-700 mx-auto mb-4" />
                    <p className="text-stone-400">
                      No bot accounts found for this user
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedUser.bot_accounts.map((account) => (
                      <div
                        key={account.id}
                        className="bg-black/30 border border-stone-800 rounded-lg overflow-hidden"
                      >
                        {/* Bot Account Header */}
                        <div
                          onClick={() => toggleAccountExpand(account.id)}
                          className="p-4 flex items-start justify-between cursor-pointer hover:bg-stone-900/30 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div>
                                <h3 className="text-white font-medium">
                                  {account.name}
                                </h3>
                                <div className="flex flex-col gap-1 mt-1">
                                  <div className="flex items-center gap-1 text-xs text-stone-500 font-mono">
                                    ID: #{account.id}
                                  </div>
                                  {account.account_uid && (
                                    <div className="flex items-center gap-1 text-xs text-stone-500 font-mono">
                                      UID: {account.account_uid}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <button className="p-1.5 hover:bg-stone-800 rounded transition-colors">
                            {expandedAccountId === account.id ? (
                              <ChevronUp className="h-4 w-4 text-stone-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-stone-400" />
                            )}
                          </button>
                        </div>

                        {/* Selected Bots Section */}
                        {expandedAccountId === account.id && (
                          <div className="border-t border-stone-800 p-4 bg-black/20">
                            <h4 className="text-sm font-medium text-stone-300 mb-3">
                              Selected Bots
                            </h4>

                            {account.selected_bots.length === 0 ? (
                              <p className="text-sm text-stone-500 text-center py-4">
                                No selected bots for this account
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {account.selected_bots.map((bot) => (
                                  <div
                                    key={bot.id}
                                    className="bg-stone-900/50 border border-stone-800 rounded-lg p-3"
                                  >
                                    <div className="flex flex-col gap-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-white font-medium">
                                          {bot.name}
                                        </span>
                                        <span className="text-xs px-2 py-1 bg-stone-800 rounded-full text-stone-300">
                                          {bot.currency_name}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 text-xs text-stone-500 font-mono">
                                        ID: #{bot.id}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
