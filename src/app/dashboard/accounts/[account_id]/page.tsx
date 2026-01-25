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
} from "lucide-react";

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
                <button className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded-lg transition-colors cursor-pointer">
                  Refresh Data
                </button>
                <button className="px-3 py-1.5 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 text-xs rounded-lg transition-colors cursor-pointer">
                  Edit Account
                </button>
                <button className="px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs rounded-lg transition-colors cursor-pointer">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Balance Card */}
          <div className="bg-black/30 border border-stone-800 rounded-lg p-6 hover:border-stone-700 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 rounded-lg bg-green-600/20">
                <BotMessageSquare className="text-green-400 h-5 w-5" />
              </div>
              <span className="text-xs px-2 py-1 bg-stone-800/50 text-stone-300 rounded">
                Bot Balance
              </span>
            </div>
            <h3 className="text-sm text-stone-400 mb-1">
              Sofi: <span className="font-medium text-white">326 Wists</span>
            </h3>
            <h3 className="text-sm text-stone-400 mb-1">
              Karuta:{" "}
              <span className="font-medium text-white">176 Tickets</span>
            </h3>
            <h3 className="text-sm text-stone-400 mb-1">
              Nairi: <span className="font-medium text-white">141 Jades</span>
            </h3>
            <p className="text-stone-400 text-xs">Approx Wallet Balance</p>
          </div>

          {/* Last Cross Trade Card */}
          <div className="bg-black/30 border border-stone-800 rounded-lg p-6 hover:border-stone-700 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 rounded-lg bg-blue-600/20">
                <RefreshCw className="text-blue-400 h-5 w-5" />
              </div>
              <span className="text-xs px-2 py-1 bg-stone-800/50 text-stone-300 rounded">
                Last Crosstrade
              </span>
            </div>
            <h3 className="text-sm text-stone-400 mb-1">
              Sofi:{" "}
              <span className="font-medium text-white">
                {accountStats.lastCrossTrade}
              </span>
            </h3>
            <h3 className="text-sm text-stone-400 mb-1">
              Karuta:{" "}
              <span className="font-medium text-white">
                {accountStats.lastCrossTrade}
              </span>
            </h3>
            <h3 className="text-sm text-stone-400 mb-1">
              Nairi:{" "}
              <span className="font-medium text-white">
                {accountStats.lastCrossTrade}
              </span>
            </h3>
          </div>

          {/* Next Cross Trade Card */}
          <div className="bg-black/30 border border-stone-800 rounded-lg p-6 hover:border-stone-700 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 rounded-lg bg-purple-600/20">
                <Calendar className="text-purple-400 h-5 w-5" />
              </div>
              <span className="text-xs px-2 py-1 bg-stone-800/50 text-stone-300 rounded">
                Crosstrade cooldown
              </span>
            </div>
            <h3 className="text-sm text-stone-400 mb-1">
              Sofi:{" "}
              <span className="font-medium text-white">
                9 days 23 hours 43 minutes
              </span>
            </h3>
            <h3 className="text-sm text-stone-400 mb-1">
              Karuta:{" "}
              <span className="font-medium text-white">
                2 days 1 hour 23 minutes
              </span>
            </h3>
            <h3 className="text-sm text-stone-400 mb-1">
              Nairi:{" "}
              <span
                className={`font-medium ${
                  true ? `text-green-400` : `text-white`
                }`}
              >
                {true ? `READY` : `3 days 1 hour 23 minutes`}
              </span>
            </h3>

            <p className="text-stone-400 text-sm">Remaining time</p>
          </div>

          {/* Account Status Card */}
          <div className="bg-black/30 border border-stone-800 rounded-lg p-6 hover:border-stone-700 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 rounded-lg bg-emerald-600/20">
                <Shield className="text-emerald-400 h-5 w-5" />
              </div>
              <span className="text-xs px-2 py-1 bg-emerald-900/30 text-emerald-300 rounded">
                {accountStats.accountStatus}
              </span>
            </div>
            <h3 className="text-2xl font-medium text-white mb-1">
              {accountStats.activeBots}
            </h3>
            <p className="text-stone-400 text-sm">Bots in account</p>
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-stone-800">
              {/* TODO: Return bots name associated with this account */}
              {["Sofi", "Karuta", "Nairi"].map((botName) => (
                <div
                  key={botName}
                  className="bg-black text-stone-500 text-sm border border-stone-900 px-3 py-1 rounded-lg"
                >
                  {botName}
                </div>
              ))}
            </div>
          </div>
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
                    <span className=" text-white break-all">
                      {accountInfo.name}{" "}
                    </span>
                  </p>
                  <p className="text-stone-300 text-xs">
                    Account UID:{" "}
                    <span className=" text-white break-all">
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
                    <div className="flex justify-between items-center">
                      <span className="text-stone-400 text-sm">
                        Total Trades
                      </span>
                      <span className="text-yellow-400 font-medium">
                        {accountStats.tradeCount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-stone-400 text-sm">
                        Total Profit ($)
                      </span>
                      <span className="text-green-400 font-medium">$28.50</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-stone-400 text-sm">
                        Total Profit (₹)
                      </span>
                      <span className="text-green-400 font-medium">
                        ₹43,899.00
                      </span>
                    </div>
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
                {/* Option 4: Account Analytics */}
                <Link
                  href={`/dashboard/accounts/${account_id}/analytics`}
                  className="group bg-black/30 border border-stone-800 rounded-lg p-5 hover:border-amber-600 hover:bg-amber-900/10 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-amber-600/20 group-hover:bg-amber-600/30 transition-colors">
                      <BarChart3 className="h-5 w-5 text-amber-400" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-stone-500 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    Account Analytics
                  </h3>
                  <p className="text-stone-400 text-sm">
                    Detailed performance metrics and insights
                  </p>
                </Link>

                <Link
                  href={`/dashboard/accounts/${account_id}/withdraw`}
                  className="group bg-black/30 border border-stone-800 rounded-lg p-5 hover:border-red-600 hover:bg-red-900/10 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-red-600/20 group-hover:bg-red-600/30 transition-colors">
                      <CreditCard className="h-5 w-5 text-red-400" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-stone-500 group-hover:text-red-400 transition-colors" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    Balance
                  </h3>
                  <p className="text-stone-400 text-sm">
                    Approximate balance for each bot
                  </p>
                </Link>

                {/* Option 3: Cross Trade Settings */}
                <Link
                  href={`/dashboard/accounts/${account_id}/cross-trade`}
                  className="group bg-black/30 border border-stone-800 rounded-lg p-5 hover:border-purple-600 hover:bg-purple-900/10 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-purple-600/20 group-hover:bg-purple-600/30 transition-colors">
                      <RefreshCw className="h-5 w-5 text-purple-400" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-stone-500 group-hover:text-purple-400 transition-colors" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    Cross Trade Manager
                  </h3>
                  <p className="text-stone-400 text-sm">
                    Manage all cross trades
                  </p>
                </Link>

                {/* Option 1: Manage Bots */}
                <Link
                  href={`/dashboard/accounts/${account_id}/bots`}
                  className="group bg-black/30 border border-stone-800 rounded-lg p-5 hover:border-blue-600 hover:bg-blue-900/10 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-blue-600/20 group-hover:bg-blue-600/30 transition-colors">
                      <Settings className="h-5 w-5 text-blue-400" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-stone-500 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    Manage Bots
                  </h3>
                  <p className="text-stone-400 text-sm">
                    Configure bots for this account
                  </p>
                </Link>

                {/* Option 2: Transaction History */}
                <Link
                  href={`/dashboard/accounts/${account_id}/transactions`}
                  className="group bg-black/30 border border-stone-800 rounded-lg p-5 hover:border-emerald-600 hover:bg-emerald-900/10 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-emerald-600/20 group-hover:bg-emerald-600/30 transition-colors">
                      <History className="h-5 w-5 text-emerald-400" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-stone-500 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    Transaction Logs
                  </h3>
                  <p className="text-stone-400 text-sm">
                    View all trades and balance logs
                  </p>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Account Details */}
        </div>
      </div>
    </PageWrapper>
  );
}
