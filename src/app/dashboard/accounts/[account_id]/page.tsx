"use client";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import PageWrapper from "../../../(components)/PageWrapper";
import Link from "next/link";
import {
  RefreshCw,
  Calendar,
  Clock,
  User,
  Settings,
  Shield,
  BarChart3,
  ChevronRight,
  History,
  CreditCard,
  BotMessageSquare,
  BotIcon,
  ArrowLeft,
  LucideIcon,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import getAxiosErrorMessage from "@/utils/Variables/getAxiosError.util";
import CountdownTimer from "../../../(components)/CountdownTimer";
import { formatDateTime, formatDate } from "@/utils/main.util";
import { BLUE_Button } from "../../../../utils/CSS/Button.util";
import { BotAccountResponse } from "../../../api/dashboard/account/[account_id]/route";

interface BotInfo {
  name: string;
  balance: number;
  currency: string;
  lastTrade: string;
  cooldown: string;
  isReady?: boolean;
  last_crosstraded_at: string | null;
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

interface StatCard {
  title: string;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  badgeColor: string;
  content: React.ReactNode;
  description?: string;
}

interface TradeStat {
  label: string;
  value: string;
  valueColor: string;
}

export default function GameAccountManager() {
  const { account_id } = useParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [account, setAccount] = useState<BotAccountResponse | null>(null);

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

  if (loading) {
    return (
      <PageWrapper withSidebar sidebarRole="user">
        <div className="min-h-screen p-4 md:p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-stone-400 mt-2">Loading account data...</p>
          </div>
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
              className={`px-4 py-2 ${BLUE_Button}} text-white rounded-lg transition-colors cursor-pointer inline-block`}
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
  }));

  const optionCards: OptionCard[] = [
    {
      href: `/dashboard/accounts/${account_id}/analytics`,
      icon: BarChart3,
      title: "Account Analytics",
      description: "Detailed performance metrics and insights",
      color: "amber",
      iconColor: "text-amber-400",
      hoverBorderColor: "hover:border-amber-600",
      hoverBgColor: "hover:bg-amber-900/10",
    },
    {
      href: `/dashboard/accounts/${account_id}/withdraw`,
      icon: CreditCard,
      title: "Balance",
      description: "Approximate balance for each bot",
      color: "red",
      iconColor: "text-red-400",
      hoverBorderColor: "hover:border-red-600",
      hoverBgColor: "hover:bg-red-900/10",
    },
    {
      href: `/dashboard/accounts/${account_id}/crosstrade`,
      icon: RefreshCw,
      title: "Cross Trade Manager",
      description: "Manage all cross trades",
      color: "purple",
      iconColor: "text-purple-400",
      hoverBorderColor: "hover:border-purple-600",
      hoverBgColor: "hover:bg-purple-900/10",
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
    {
      href: `/dashboard/accounts/${account_id}/transactions`,
      icon: History,
      title: "Transaction Logs",
      description: "View all trades and balance logs",
      color: "emerald",
      iconColor: "text-emerald-400",
      hoverBorderColor: "hover:border-emerald-600",
      hoverBgColor: "hover:bg-emerald-900/10",
    },
  ];

  const tradeStats: TradeStat[] = [
    {
      label: "Total Trades",
      value: account.trade_count.toString(),
      valueColor: "text-white",
    },
    {
      label: "Net Profit ($)",
      value: "--",
      valueColor: "text-green-400",
    },
    {
      label: "Net Profit (₹)",
      value: "--",
      valueColor: "text-green-400",
    },
  ];

  const statCards: StatCard[] = [
    {
      title: "Wallet",
      icon: BotMessageSquare,
      iconBgColor: "bg-green-600/20",
      iconColor: "text-green-400",
      badgeColor: "bg-stone-800/50",
      content: (
        <>
          {botsData.map((bot) => (
            <h3 key={bot.name} className="text-sm text-stone-400 mb-1">
              {bot.name}:{" "}
              <span className="font-medium text-green-400">
                {bot.balance}{" "}
                {bot.balance > 1 ? `${bot.currency}s` : `${bot.currency}`}
              </span>
            </h3>
          ))}
          {botsData.length === 0 && (
            <p className="text-stone-400 text-sm">No bots configured</p>
          )}
        </>
      ),
      description: "",
    },
    {
      title: "Last Crosstrade",
      icon: RefreshCw,
      iconBgColor: "bg-blue-600/20",
      iconColor: "text-blue-400",
      badgeColor: "bg-stone-800/50",
      content: (
        <>
          {botsData.map((bot) => (
            <h3 key={bot.name} className="text-sm text-stone-400 mb-1">
              {bot.name}:{" "}
              <span className="font-medium text-white">{bot.lastTrade}</span>
            </h3>
          ))}
          {botsData.length === 0 && (
            <p className="text-stone-400 text-sm">No trades yet</p>
          )}
        </>
      ),
    },
    {
      title: "Crosstrade Cooldown",
      icon: Calendar,
      iconBgColor: "bg-purple-600/20",
      iconColor: "text-purple-400",
      badgeColor: "bg-stone-800/50",
      content: (
        <>
          {botsData.map((bot) => (
            <h3 key={bot.name} className="text-sm text-stone-400 mb-1">
              {bot.name}: <CountdownTimer startDate={bot.last_crosstraded_at} />
            </h3>
          ))}
          {botsData.length === 0 && (
            <p className="text-stone-400 text-sm">No bots configured</p>
          )}
        </>
      ),
      description: "",
    },
    {
      title: "Account Status",
      icon: Shield,
      iconBgColor: "bg-emerald-600/20",
      iconColor: "text-emerald-400",
      badgeColor:
        account.selected_bots.length > 0
          ? "bg-emerald-900/30"
          : "bg-stone-800/50",
      content: (
        <>
          <h3 className="text-2xl font-medium text-white mb-1">
            {account.selected_bots.length}
          </h3>
          <p className="text-stone-400 text-sm">Bots in account</p>
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-stone-800">
            {botsData.map((bot) => (
              <div
                key={bot.name}
                className="bg-black text-stone-500 text-sm border border-stone-900 px-3 py-1 rounded-lg"
              >
                {bot.name}
              </div>
            ))}
            {botsData.length === 0 && (
              <p className="text-stone-500 text-sm">No bots selected</p>
            )}
          </div>
        </>
      ),
    },
  ];

  const quickActions = [
    {
      text: "Refresh Data",
      bgColor: "bg-stone-800 hover:bg-stone-700",
      textColor: "text-stone-300",
      onClick: fetchAccountData,
    },
    {
      text: "Edit Account",
      bgColor: "bg-blue-900/30 hover:bg-blue-900/50",
      textColor: "text-blue-400",
      onClick: () => toast("Edit feature coming soon"),
    },
    {
      text: "Delete Account",
      bgColor: "bg-red-900/30 hover:bg-red-900/50",
      textColor: "text-red-400",
      onClick: () => toast("Delete feature coming soon"),
    },
  ];

  return (
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="bg-black/30 border border-stone-800 rounded-lg p-6 hover:border-stone-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2 rounded-lg ${stat.iconBgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <span
                  className={`text-xs px-2 py-1 ${stat.badgeColor} text-stone-300 rounded`}
                >
                  {stat.title}
                </span>
              </div>
              {stat.content}
              {stat.description && (
                <p className="text-stone-400 text-xs mt-1">
                  {stat.description}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    <span className="text-sm text-stone-400">User Details</span>
                  </div>
                  <p className="text-stone-300 text-xs">
                    Account Name:{" "}
                    <span className="text-white break-all">{account.name}</span>
                  </p>
                  <p className="text-stone-300 text-xs">
                    Account UID:{" "}
                    <span className="text-white break-all">
                      {account.account_uid || "Not set"}
                    </span>
                  </p>
                </div>

                {/* Trade Statistics */}
                <div className="bg-black/30 border border-stone-800 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <BarChart3 className="h-4 w-4 text-stone-500" />
                    <span className="text-sm text-stone-400">
                      Trade Statistics
                    </span>
                  </div>
                  <div className="space-y-2">
                    {tradeStats.map((stat, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <span className="text-stone-400 text-sm">
                          {stat.label}
                        </span>
                        <span className={`font-medium ${stat.valueColor}`}>
                          {stat.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Created Date */}
                <div className="bg-black/30 border border-stone-800 rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="h-4 w-4 text-stone-500" />
                    <span className="text-sm text-stone-400">Created Date</span>
                  </div>
                  <p className="text-white text-sm">
                    {formatDateTime(account.created_at)}
                  </p>
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="h-4 w-4 text-stone-500" />
                    <span className="text-sm text-stone-400">Last Updated</span>
                  </div>
                  <p className="text-white text-sm">
                    {formatDateTime(account.updated_at)} (
                    {formatDate(account.updated_at)})
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Left Column - Options */}
          <div className="lg:col-span-2">
            <div className="bg-stone-950 border border-stone-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-medium text-white">
                  Account Options
                </h2>
                <p className="text-stone-500 text-sm">Choose an action</p>
              </div>

              {/* Options Grid */}
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
                          className={`p-2 rounded-lg bg-${option.color}-600/20 group-hover:bg-${option.color}-600/30 transition-colors`}
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
  );
}
