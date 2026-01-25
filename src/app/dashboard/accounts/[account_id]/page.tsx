"use client";
import { useParams } from "next/navigation";
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

interface BotInfo {
  name: string;
  balance: string;
  currency: string;
  lastTrade: string;
  cooldown: string;
  isReady?: boolean;
}

interface StatCard {
  title: string;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  badgeText: string;
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

  const accountStats = {
    balance: "326",
    lastCrossTrade: "15th Jan, 2026 14:30",
    nextCrossTrade: "2024-01-20",
    tradeCount: 47,
    activeBots: 3,
    accountStatus: "Active",
  };

  const accountInfo = {
    name: "ItsMe Prince",
    uid: "310672946316181514",
    created: "2023-11-10",
    lastUpdated: "2024-01-18",
  };

  // Bot information array
  const botsData: BotInfo[] = [
    {
      name: "Sofi",
      balance: "326",
      currency: "Wists",
      lastTrade: accountStats.lastCrossTrade,
      cooldown: "9 days 23 hours 43 minutes",
      isReady: false,
    },
    {
      name: "Karuta",
      balance: "176",
      currency: "Tickets",
      lastTrade: accountStats.lastCrossTrade,
      cooldown: "2 days 1 hour 23 minutes",
      isReady: false,
    },
    {
      name: "Nairi",
      balance: "141",
      currency: "Jades",
      lastTrade: accountStats.lastCrossTrade,
      cooldown: "3 days 1 hour 23 minutes",
      isReady: true,
    },
  ];

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

  // Trade statistics array
  const tradeStats: TradeStat[] = [
    {
      label: "Total Trades",
      value: accountStats.tradeCount.toString(),
      valueColor: "text-yellow-400",
    },
    {
      label: "Total Profit ($)",
      value: "$28.50",
      valueColor: "text-green-400",
    },
    {
      label: "Total Profit (₹)",
      value: "₹43,899.00",
      valueColor: "text-green-400",
    },
  ];

  // Stat cards array
  const statCards: StatCard[] = [
    {
      title: "Bot Balance",
      icon: BotMessageSquare,
      iconBgColor: "bg-green-600/20",
      iconColor: "text-green-400",
      badgeText: "Bot Balance",
      badgeColor: "bg-stone-800/50",
      content: (
        <>
          {botsData.map((bot) => (
            <h3 key={bot.name} className="text-sm text-stone-400 mb-1">
              {bot.name}:{" "}
              <span className="font-medium text-white">
                {bot.balance} {bot.currency}
              </span>
            </h3>
          ))}
        </>
      ),
      description: "Approx Wallet Balance",
    },
    {
      title: "Last Crosstrade",
      icon: RefreshCw,
      iconBgColor: "bg-blue-600/20",
      iconColor: "text-blue-400",
      badgeText: "Last Crosstrade",
      badgeColor: "bg-stone-800/50",
      content: (
        <>
          {botsData.map((bot) => (
            <h3 key={bot.name} className="text-sm text-stone-400 mb-1">
              {bot.name}:{" "}
              <span className="font-medium text-white">{bot.lastTrade}</span>
            </h3>
          ))}
        </>
      ),
    },
    {
      title: "Crosstrade cooldown",
      icon: Calendar,
      iconBgColor: "bg-purple-600/20",
      iconColor: "text-purple-400",
      badgeText: "Crosstrade cooldown",
      badgeColor: "bg-stone-800/50",
      content: (
        <>
          {botsData.map((bot) => (
            <h3 key={bot.name} className="text-sm text-stone-400 mb-1">
              {bot.name}:{" "}
              <span
                className={`font-medium ${
                  bot.isReady ? "text-green-400" : "text-white"
                }`}
              >
                {bot.isReady ? "READY" : bot.cooldown}
              </span>
            </h3>
          ))}
        </>
      ),
      description: "Remaining time",
    },
    {
      title: "Account Status",
      icon: Shield,
      iconBgColor: "bg-emerald-600/20",
      iconColor: "text-emerald-400",
      badgeText: accountStats.accountStatus,
      badgeColor: "bg-emerald-900/30",
      content: (
        <>
          <h3 className="text-2xl font-medium text-white mb-1">
            {accountStats.activeBots}
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
          </div>
        </>
      ),
    },
  ];

  // Quick action buttons
  const quickActions = [
    {
      text: "Refresh Data",
      bgColor: "bg-stone-800 hover:bg-stone-700",
      textColor: "text-stone-300",
    },
    {
      text: "Edit Account",
      bgColor: "bg-blue-900/30 hover:bg-blue-900/50",
      textColor: "text-blue-400",
    },
    {
      text: "Delete Account",
      bgColor: "bg-red-900/30 hover:bg-red-900/50",
      textColor: "text-red-400",
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
                    {accountInfo.name}
                  </h1>
                  <p className="text-stone-400 text-xs">#{account_id}</p>
                </div>
              </div>
            </div>
            <div>
              <div className="flex flex-wrap justify-end gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
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
                  {stat.badgeText}
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
                    <span className="text-white break-all">
                      {accountInfo.name}
                    </span>
                  </p>
                  <p className="text-stone-300 text-xs">
                    Account UID:{" "}
                    <span className="text-white break-all">
                      {accountInfo.uid}
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
                  <p className="text-white text-sm">{accountInfo.created}</p>
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="h-4 w-4 text-stone-500" />
                    <span className="text-sm text-stone-400">Last Updated</span>
                  </div>
                  <p className="text-white text-sm">
                    {accountInfo.lastUpdated}
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
