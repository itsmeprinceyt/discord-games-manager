"use client";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import PageWrapper from "../../../(components)/PageWrapper";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  Settings,
  Shield,
  BarChart3,
  ChevronRight,
  CreditCard,
  BotIcon,
  ArrowLeft,
  LucideIcon,
  Trash,
  X,
  AlertTriangle,
  Loader2Icon,
  TriangleDashed,
  CircleDashed,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import getAxiosErrorMessage from "../../../../utils/Variables/getAxiosError.util";
import CountdownTimer from "../../../(components)/CountdownTimer";
import {
  formatDateTime,
  formatDate,
  CURRENCY_COOLDOWN_DAYS,
} from "@/utils/main.util";
import {
  BLUE_Button,
  RED_Button,
  STONE_Button,
} from "../../../../utils/CSS/Button.util";
import { BotAccountResponse } from "../../../api/dashboard/account/[account_id]/route";
import Loader from "../../../(components)/Loader";

interface BotInfo {
  name: string;
  balance: number;
  currency: string;
  lastTrade: string;
  cooldown: string;
  isReady?: boolean;
  last_crosstraded_at: string | null;
  last_currency_crosstraded_at: string | null;
}

interface OptionCard {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  iconColor: string;
  hoverBorderColor: string;
  hoverBgColor: string;
}

function BotCard({ bot }: { bot: BotInfo }) {
  const hasTraded = !!bot.last_crosstraded_at;

  return (
    <div className="group relative bg-stone-950 border border-stone-800 rounded-lg p-5 hover:border-stone-600 transition-all duration-300 hover:shadow-lg hover:shadow-black/40 overflow-hidden">
      {/* Bot header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-semibold text-white leading-tight">
          {bot.name}
        </h3>
        {/* Balance badge */}
        <div className="flex flex-col items-end">
          <span className="text-lg font-bold text-green-400 leading-tight">
            {bot.balance.toLocaleString()}
          </span>
          <span className="text-[10px] text-stone-500 leading-tight">
            {bot.balance === 1 ? bot.currency : `${bot.currency}s`}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-stone-800 mb-4" />

      {/* Trade info grid */}
      <div className="grid grid-cols-1 gap-3">
        {/* Crosstrade Cooldown */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-stone-500 whitespace-nowrap">
              Crosstrade Cooldown
            </span>
          </div>
          <span className="text-[11px] text-right">
            <CountdownTimer startDate={bot.last_crosstraded_at} />
          </span>
        </div>

        {/* Currency Cooldown */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-stone-500 whitespace-nowrap">
              Currency Crosstrade Cooldown
            </span>
          </div>
          <span className="text-[11px] text-right">
            <CountdownTimer
              cooldownDays={CURRENCY_COOLDOWN_DAYS}
              startDate={bot.last_currency_crosstraded_at}
            />
          </span>
        </div>

        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-stone-500 whitespace-nowrap">
              Last Crosstrade
            </span>
          </div>
          <span className="text-[11px] text-stone-600 text-right truncate max-w-[60%]">
            {hasTraded ? (
              bot.lastTrade
            ) : (
              <span className="text-stone-600">--</span>
            )}
          </span>
        </div>

        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-stone-500 whitespace-nowrap">
              Last Currency Crosstrade
            </span>
          </div>
          <span className="text-[11px] text-stone-600 text-right truncate max-w-[60%]">
            {bot.last_currency_crosstraded_at ? (
              <>
                {formatDateTime(bot.last_currency_crosstraded_at)} (
                {formatDate(bot.last_currency_crosstraded_at)})
              </>
            ) : (
              <span className="text-stone-600">--</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function GameAccountManager() {
  const { account_id } = useParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [account, setAccount] = useState<BotAccountResponse | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchAccountData = useCallback(async () => {
    if (!account_id) return;

    try {
      setLoading(true);
      const response = await axios.get(`/api/dashboard/account/${account_id}`);

      if (response.data.success) {
        setAccount(response.data.data);
      } else {
        toast.error(response.data.error || "Failed to fetch account data");
      }
    } catch (err: unknown) {
      const message = getAxiosErrorMessage(err, "Error fetching account data");
      toast.error(message);
      console.error("Error fetching account data:", err);
    } finally {
      setLoading(false);
    }
  }, [account_id]);

  useEffect(() => {
    fetchAccountData();
  }, [fetchAccountData]);

  const handleDeleteClick = () => setShowDeleteModal(true);

  const confirmDeleteAccount = async () => {
    if (!account_id || !account) {
      toast.error("Invalid account ID");
      return;
    }

    setDeleting(true);

    try {
      const response = await axios.delete("/api/dashboard/account/delete", {
        params: { id: account_id },
      });

      if (response.data.success) {
        toast.success("Account deleted successfully!");
        setTimeout(() => {
          window.location.href = "/dashboard/accounts";
        }, 1500);
      }
    } catch (err: unknown) {
      const message = getAxiosErrorMessage(err, "Error deleting account");
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleting(false);
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

  if (!account) {
    return (
      <PageWrapper withSidebar sidebarRole="user">
        <div className="min-h-screen p-4 md:p-6 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-medium text-stone-300 mb-2">
              Account not found
            </h3>
            <p className="text-stone-500 mb-4">
              The account you&apos;re looking for doesn&apos;t exist or you
              don&apos;t have permission to access it.
            </p>
            <Link
              href="/dashboard/accounts"
              className={`px-4 py-2 ${BLUE_Button} text-white rounded-lg transition-colors cursor-pointer inline-block`}
            >
              Back to Accounts
            </Link>
          </div>
        </div>
      </PageWrapper>
    );
  }

  const botsData: BotInfo[] = account.selected_bots.map((bot) => ({
    name: bot.name,
    balance: bot.balance || 0,
    currency: bot.currency_name,
    lastTrade: bot.last_crosstraded_at
      ? `${formatDateTime(bot.last_crosstraded_at)} (${formatDate(
          bot.last_crosstraded_at
        )})`
      : "--",
    cooldown: bot.last_crosstraded_at || "",
    last_crosstraded_at: bot.last_crosstraded_at,
    last_currency_crosstraded_at: bot.last_currency_crosstraded_at,
  }));

  const optionCards: OptionCard[] = [
    {
      href: `/dashboard/accounts/${account_id}/analytics-logs`,
      icon: BarChart3,
      title: "Account Analytics",
      description: "Detailed performance metrics and insights",
      color: "amber",
      iconColor: "text-amber-400",
      hoverBorderColor: "hover:border-amber-600",
      hoverBgColor: "hover:bg-amber-900/10",
    },
    {
      href: `/dashboard/accounts/${account_id}/wallet`,
      icon: CreditCard,
      title: "Wallet",
      description: "Approximate balance for each bot",
      color: "red",
      iconColor: "text-red-400",
      hoverBorderColor: "hover:border-red-600",
      hoverBgColor: "hover:bg-red-900/10",
    },
    {
      href: `/dashboard/accounts/${account_id}/crosstrade`,
      icon: TriangleDashed,
      title: "Crosstrade Manager",
      description: "Manage all crosstrades",
      color: "purple",
      iconColor: "text-purple-400",
      hoverBorderColor: "hover:border-purple-600",
      hoverBgColor: "hover:bg-purple-900/10",
    },
    {
      href: `/dashboard/accounts/${account_id}/currency-crosstrade`,
      icon: CircleDashed,
      title: "Currency Crosstrade Manager",
      description: "Manage all currency crosstrades",
      color: "orange",
      iconColor: "text-orange-400",
      hoverBorderColor: "hover:border-orange-600",
      hoverBgColor: "hover:bg-orange-900/10",
    },
    {
      href: `/dashboard/accounts/${account_id}/bots`,
      icon: Settings,
      title: "Manage Bots",
      description: "Configure bots for this account",
      color: "blue",
      iconColor: "text-blue-400",
      hoverBorderColor: "hover:border-blue-600",
      hoverBgColor: "hover:bg-blue-900/10",
    },
  ];

  const quickActions = [
    {
      text: "Refresh Data",
      bgColor: "hover:bg-stone-900",
      textColor: "text-stone-300",
      onClick: fetchAccountData,
    },
    {
      text: "Edit Account",
      bgColor: "hover:bg-blue-950",
      textColor: "text-blue-400",
      onClick: () => toast("Edit feature coming soon"),
    },
    {
      text: "Delete Account",
      bgColor: "hover:bg-red-950",
      textColor: "text-red-400",
      onClick: handleDeleteClick,
    },
  ];

  return (
    <>
      <PageWrapper withSidebar sidebarRole="user">
        <div className="min-h-screen p-4 md:p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Link
                  href={`/dashboard/accounts/`}
                  className="p-2 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-5 w-5 text-stone-400" />
                </Link>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <BotIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-medium text-white">
                      {account.name}
                    </h1>
                    <p className="text-stone-400 text-xs">#{account.id}</p>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex flex-wrap justify-end gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.onClick}
                      className={`px-3 py-1.5 ${action.bgColor} ${action.textColor} text-xs rounded-lg transition-colors cursor-pointer`}
                    >
                      {action.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Bot Cards Section ── */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-medium text-stone-400">
                  Configured Bots
                </h2>
                <span className="text-xs px-2 py-0.5 bg-stone-800 text-stone-400 rounded-full">
                  {botsData.length}
                </span>
              </div>
            </div>

            {botsData.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {botsData.map((bot) => (
                  <BotCard key={bot.name} bot={bot} />
                ))}
              </div>
            ) : (
              <div className="bg-black/30 border border-stone-800 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-stone-900 flex items-center justify-center">
                  <BotIcon className="h-6 w-6 text-stone-600" />
                </div>
                <p className="text-stone-500 text-sm">No bots configured yet</p>
                <Link
                  href={`/dashboard/accounts/${account_id}/bots`}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Add bots →
                </Link>
              </div>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Account Details */}
            <div className="lg:col-span-1">
              <div className="bg-stone-950 border border-stone-800 rounded-xl p-6">
                <h2 className="text-xl font-medium text-white mb-6">
                  Account Details
                </h2>

                <div className="space-y-4">
                  {/* Account UID */}
                  <div className="bg-black/30 border border-stone-800 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="h-4 w-4 text-stone-500" />
                      <span className="text-sm text-stone-400">
                        User Details
                      </span>
                    </div>
                    <p className="text-stone-300 text-xs">
                      Account Name:{" "}
                      <span className="text-white break-all">
                        {account.name}
                      </span>
                    </p>
                    <p className="text-stone-300 text-xs">
                      Account UID:{" "}
                      <span className="text-white break-all">
                        {account.account_uid || "Not set"}
                      </span>
                    </p>
                  </div>

                  {/* Dates */}
                  <div className="bg-black/30 border border-stone-800 rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="h-4 w-4 text-stone-500" />
                      <span className="text-sm text-stone-400">
                        Created Date
                      </span>
                    </div>
                    <p className="text-white text-sm">
                      {formatDateTime(account.created_at)}
                    </p>
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="h-4 w-4 text-stone-500" />
                      <span className="text-sm text-stone-400">
                        Last Updated
                      </span>
                    </div>
                    <p className="text-white text-sm">
                      {formatDateTime(account.updated_at)} (
                      {formatDate(account.updated_at)})
                    </p>
                  </div>

                  {/* Account Status */}
                  <div className="bg-black/30 border border-stone-800 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Shield className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm text-stone-400">
                        Account Status
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          botsData.length > 0
                            ? "bg-emerald-400"
                            : "bg-stone-600"
                        }`}
                      />
                      <span className="text-white text-sm">
                        {botsData.length > 0
                          ? `${botsData.length} bot${
                              botsData.length > 1 ? "s" : ""
                            } active`
                          : "No bots configured"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Options */}
            <div className="lg:col-span-2">
              <div className="bg-stone-950 border border-stone-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-medium text-white">
                    Account Options
                  </h2>
                  <p className="text-stone-500 text-sm">Choose an action</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {optionCards.map((option, index) => {
                    const Icon = option.icon;
                    return (
                      <Link
                        key={index}
                        href={option.href}
                        className={`group bg-black/30 border border-stone-800 rounded-lg p-5 ${option.hoverBorderColor} ${option.hoverBgColor} transition-all duration-200 cursor-pointer`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div
                            className={`p-2 rounded-lg group-hover:bg-${option.color}-600/30 transition-colors`}
                          >
                            <Icon className={`h-5 w-5 ${option.iconColor}`} />
                          </div>
                          <ChevronRight
                            className={`h-4 w-4 text-stone-500 group-hover:${option.iconColor} transition-colors`}
                          />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">
                          {option.title}
                        </h3>
                        <p className="text-stone-400 text-sm">
                          {option.description}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="bg-black/90 border border-stone-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-900/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <h2 className="text-xl font-medium text-white">
                  Delete Account
                </h2>
              </div>
              <button
                onClick={closeDeleteModal}
                className="p-2 hover:bg-stone-900 rounded-lg transition-colors cursor-pointer"
                disabled={deleting}
              >
                <X className="h-5 w-5 text-stone-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-red-900/10 border border-red-800/50 rounded-lg">
                <p className="text-red-200 text-center font-medium">
                  Are you sure you want to delete this account?
                </p>
              </div>

              <div className="p-4 bg-stone-900/30 rounded-lg">
                <p className="text-stone-300 text-center">
                  You are about to delete the account:
                </p>
                <p className="text-white text-center font-medium text-lg mt-2">
                  {account.name}
                </p>
                <p className="text-stone-400 text-xs text-center mt-2">
                  This action cannot be undone. All data associated with this
                  account will be permanently removed.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className={`flex-1 p-3 ${STONE_Button} text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteAccount}
                  disabled={deleting}
                  className={`flex-1 p-3 ${
                    deleting
                      ? "bg-red-900/50 cursor-not-allowed"
                      : `${RED_Button} cursor-pointer`
                  } text-white rounded-lg font-medium flex items-center justify-center gap-2`}
                >
                  {deleting ? (
                    <>
                      <Loader2Icon size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash className="h-4 w-4" />
                      Delete Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
