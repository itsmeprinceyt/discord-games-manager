"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import PageWrapper from "../../../../(components)/PageWrapper";
import Link from "next/link";
import { ArrowLeft, CreditCard, RefreshCw, AlertCircle } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import getAxiosErrorMessage from "../../../../../utils/Variables/getAxiosError.util";
import { STONE_Button } from "../../../../../utils/CSS/Button.util";
import EditBalanceModal from "../../../../(components)/Balance/EditBalanceModal";
import Loader from "../../../../(components)/Loader";

interface BotBalance {
  id: string;
  name: string;
  currency_name: string;
  balance: number;
}

interface WalletResponse {
  success: boolean;
  data: BotBalance[];
  message?: string;
}

const getCurrencyColor = (currencyName: string) => {
  const colorMap: Record<string, string> = {
    Ticket: "bg-orange-600/20 text-orange-400",
    Jade: "bg-emerald-600/20 text-emerald-400",
    Wist: "bg-purple-600/20 text-purple-400",
  };

  return colorMap[currencyName] || "bg-stone-600/20 text-stone-400";
};

export default function AccountWalletPage() {
  const { account_id } = useParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [walletData, setWalletData] = useState<BotBalance[]>([]);
  const [selectedBot, setSelectedBot] = useState<BotBalance | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  const fetchWalletData = useCallback(
    async (showLoading = true) => {
      if (!account_id) return;

      try {
        if (showLoading) setLoading(true);
        else setRefreshing(true);

        const response = await axios.get<WalletResponse>(
          `/api/dashboard/account/${account_id}/wallet`,
        );

        if (response.data.success) {
          setWalletData(response.data.data);
        } else {
          toast.error(response.data.message || "Failed to fetch balance data");
        }
      } catch (err: unknown) {
        const message = getAxiosErrorMessage(
          err,
          "Error fetching balance data",
        );
        toast.error(message);
        console.error("Error fetching balance data:", err);
      } finally {
        if (showLoading) setLoading(false);
        setRefreshing(false);
      }
    },
    [account_id],
  );

  useEffect(() => {
    const load = () => {
      fetchWalletData();
    };
    load();
  }, [fetchWalletData, account_id]);

  const handleRefresh = () => {
    fetchWalletData(false);
  };

  const handleEditClick = (bot: BotBalance) => {
    setSelectedBot(bot);
    setIsEditModalOpen(true);
  };

  const handleUpdateBalance = async (botId: string, newBalance: number) => {
    setWalletData((prev) =>
      prev.map((bot) =>
        bot.id === botId ? { ...bot, balance: newBalance } : bot,
      ),
    );

    toast.success("Balance updated successfully!");
    fetchWalletData();
  };

  const handleVotedClick = async (botId: string) => {
    try {
      const response = await axios.post(
        `/api/dashboard/account/${account_id}/wallet/manual-vote`,
        { bot_id: botId },
      );

      if (response.data.success) {
        const { new_balance } = response.data.data;

        setWalletData((prev) =>
          prev.map((bot) =>
            bot.id === botId ? { ...bot, balance: new_balance } : bot,
          ),
        );

        toast.success(response.data.message);
      }
    } catch (err: unknown) {
      const message = getAxiosErrorMessage(err, "Error adding daily reward");
      toast.error(message);
      console.error("Error adding daily reward:", err);
    }
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

  return (
    <PageWrapper withSidebar sidebarRole="user">
      <div className="min-h-screen p-4 md:p-6">
        {/* Edit Balance Modal */}
        <EditBalanceModal
          account_id={String(account_id)}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedBot(null);
          }}
          bot={selectedBot}
          onUpdate={handleUpdateBalance}
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/dashboard/accounts/${account_id}`}
                className="p-2 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-5 w-5 text-stone-400" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-600/20 rounded-lg">
                  <CreditCard className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-medium text-white">
                    Wallet
                  </h1>
                  <p className="text-stone-400 text-sm">
                    View balances for all bots
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`px-4 py-2 ${STONE_Button} text-stone-300 rounded-lg text-sm transition-colors cursor-pointer flex items-center gap-2`}
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Bot Balance Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {walletData.map((bot) => {
            const colorClass = getCurrencyColor(bot.currency_name);

            return (
              <div
                key={bot.id}
                className="bg-black/30 border border-stone-800 p-4 rounded-xl hover:border-stone-700 transition-colors"
              >
                <h3 className="text-lg font-medium text-white">{bot.name}</h3>
                <p className="text-stone-500 text-xs mb-4 truncate">
                  ID: {bot.id}
                </p>

                <div className="mb-4">
                  <p className="text-sm text-stone-400 mb-1">Balance</p>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-2xl font-bold ${
                        colorClass.split(" ")[1]
                      }`}
                    >
                      {bot.balance}
                    </span>
                    <span className={`text-sm ${colorClass.split(" ")[1]}`}>
                      {bot.balance > 1
                        ? `${bot.currency_name}s`
                        : `${bot.currency_name}`}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-800 flex justify-center gap-2">
                  <button
                    onClick={() => handleEditClick(bot)}
                    className={`w-full px-4 py-2 ${STONE_Button} text-stone-300 rounded-lg text-sm transition-colors cursor-pointer`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleVotedClick(bot.id)}
                    className={`w-full px-4 py-2 ${STONE_Button} text-stone-300 rounded-lg text-sm transition-colors cursor-pointer`}
                  >
                    I&apos;ve Voted
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {walletData.length === 0 && (
          <div className="bg-black/30 border border-stone-800 rounded-xl p-12 text-center">
            <AlertCircle className="h-16 w-16 text-stone-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-stone-300 mb-2">
              No bots found
            </h3>
            <p className="text-stone-500 mb-6 max-w-md mx-auto">
              There are no bots associated with your account yet. Add bots to
              start tracking balances.
            </p>
            <Link
              href={`/dashboard/accounts/${account_id}/bots`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 rounded-lg transition-colors cursor-pointer"
            >
              Add Bots
            </Link>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
