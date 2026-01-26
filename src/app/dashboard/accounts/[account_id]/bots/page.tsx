"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import PageWrapper from "../../../../(components)/PageWrapper";
import { Check, X, AlertCircle, Loader2, ArrowLeft, Bot } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import getAxiosErrorMessage from "../../../../../utils/Variables/getAxiosError.util";
import {
  BLUE_Button,
  STONE_Button,
} from "../../../../../utils/CSS/Button.util";

interface BotSelection {
  id: string;
  name: string;
  currency: string;
  isSelected: boolean;
  selectedBotId?: string;
}

export default function BotSelectionPage() {
  const { account_id } = useParams();
  const [bots, setBots] = useState<BotSelection[]>([]);
  const [selectedBots, setSelectedBots] = useState<string[]>([]);
  const [initialSelectedBots, setInitialSelectedBots] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  const fetchAvailableBots = useCallback(async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `/api/dashboard/account/${account_id}/bot-manage`
      );

      if (response.data.success) {
        const botsData = response.data.data;
        setBots(botsData);

        const preSelected = botsData
          .filter((bot: BotSelection) => bot.isSelected)
          .map((bot: BotSelection) => bot.id);

        setSelectedBots(preSelected);
        setInitialSelectedBots(preSelected);
      }
    } catch (error: unknown) {
      toast.error(getAxiosErrorMessage(error, "Error fetching bots"));
    } finally {
      setLoading(false);
    }
  }, [account_id]);

  useEffect(() => {
    fetchAvailableBots();
  }, [fetchAvailableBots]);

  useEffect(() => {
    const sortedSelected = [...selectedBots].sort();
    const sortedInitial = [...initialSelectedBots].sort();
    const hasChanged =
      JSON.stringify(sortedSelected) !== JSON.stringify(sortedInitial);
    setHasChanges(hasChanged);
  }, [selectedBots, initialSelectedBots]);

  const toggleBotSelection = (botId: string) => {
    setSelectedBots((prev) => {
      if (prev.includes(botId)) {
        return prev.filter((id) => id !== botId);
      } else {
        return [...prev, botId];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedBots(bots.map((bot) => bot.id));
  };

  const handleDeselectAll = () => {
    setSelectedBots([]);
  };

  const handleResetChanges = () => {
    setSelectedBots([...initialSelectedBots]);
  };

  const handleUpdate = async () => {
    if (!hasChanges) {
      toast.error("No changes to save");
      return;
    }

    setUpdating(true);
    try {
      const response = await axios.post(
        `/api/dashboard/account/${account_id}/bot-manage/update`,
        {
          botIds: selectedBots,
          botAccountId: account_id,
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Bots updated successfully!");
        setInitialSelectedBots([...selectedBots]);
        setHasChanges(false);
        await fetchAvailableBots();
      }
    } catch (error: unknown) {
      toast.error(getAxiosErrorMessage(error, "Failed to update bots"));
    } finally {
      setUpdating(false);
    }
  };

  const selectedCount = selectedBots.length;
  const totalCount = bots.length;

  return (
    <PageWrapper withSidebar sidebarRole="user">
      <div className="min-h-screen p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link
                href={`/dashboard/accounts/${account_id}`}
                className="p-2 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-5 w-5 text-stone-400" />
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-medium text-white flex flex-wrap gap-2 ">
                  Manage Bots
                  {hasChanges && (
                    <p className="text-yellow-400 text-xs mt-1">
                      You have unsaved changes
                    </p>
                  )}
                </h1>
                <p className="text-stone-400 text-sm">
                  Select bots to associate with this account
                </p>
              </div>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-yellow-300 mb-1">
                  Important Notice
                </h3>
                <p className="text-yellow-400/80 text-sm">
                  Be careful when selecting or removing bots. All data related
                  to the deselected bot (including transaction history, balance
                  logs, and trade data) for this account will be permanently
                  deleted. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-black/30 border border-stone-800 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-600/20">
                  <Bot className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-white">
                    {selectedCount} of {totalCount} bots selected
                    {hasChanges && " *"}
                  </h3>
                  <p className="text-stone-400 text-sm">
                    {selectedCount === 0
                      ? "No bots selected. Account will have no bots."
                      : selectedCount === totalCount
                      ? "All bots selected for this account"
                      : `${selectedCount} bot${
                          selectedCount !== 1 ? "s" : ""
                        } will be active`}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSelectAll}
                  className={`px-4 py-2 ${STONE_Button} text-stone-300 rounded-lg text-sm transition-colors cursor-pointer`}
                >
                  Select All
                </button>
                <button
                  onClick={handleDeselectAll}
                  className={`px-4 py-2 ${STONE_Button} text-stone-300 rounded-lg text-sm transition-colors cursor-pointer`}
                >
                  Deselect All
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-stone-400 mt-2">Loading available bots...</p>
            </div>
          ) : (
            <>
              {/* Bots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {bots.map((bot) => {
                  const isSelected = selectedBots.includes(bot.id);
                  const wasInitiallySelected = initialSelectedBots.includes(
                    bot.id
                  );

                  return (
                    <div
                      key={bot.id}
                      className={`bg-stone-950 border rounded-xl p-5 transition-all duration-200 cursor-pointer hover:scale-[1.02] ${
                        isSelected
                          ? wasInitiallySelected
                            ? "border-green-600 bg-green-900/10"
                            : "border-blue-600 bg-blue-900/10"
                          : wasInitiallySelected
                          ? "border-red-600 bg-red-900/10"
                          : "border-stone-800 hover:border-stone-700"
                      }`}
                      onClick={() => toggleBotSelection(bot.id)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              isSelected
                                ? wasInitiallySelected
                                  ? "bg-green-600/30"
                                  : "bg-blue-600/30"
                                : wasInitiallySelected
                                ? "bg-red-600/30"
                                : "bg-stone-800/50"
                            }`}
                          >
                            <Bot
                              className={`h-5 w-5 ${
                                isSelected
                                  ? wasInitiallySelected
                                    ? "text-green-400"
                                    : "text-blue-400"
                                  : wasInitiallySelected
                                  ? "text-red-400"
                                  : "text-stone-500"
                              }`}
                            />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-white">
                              {bot.name}
                            </h3>
                          </div>
                        </div>
                        <div
                          className={`p-1.5 rounded-full ${
                            isSelected
                              ? wasInitiallySelected
                                ? "bg-green-600"
                                : "bg-blue-600"
                              : wasInitiallySelected
                              ? "bg-red-600"
                              : "bg-stone-800"
                          }`}
                        >
                          {isSelected ? (
                            <Check className="h-3.5 w-3.5 text-white" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-white" />
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-stone-400">Currency:</span>
                          <span className="text-white font-medium">
                            {bot.currency}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-stone-400">Status:</span>
                          <span
                            className={`font-medium ${
                              isSelected
                                ? wasInitiallySelected
                                  ? "text-green-400"
                                  : "text-blue-400"
                                : wasInitiallySelected
                                ? "text-red-400"
                                : "text-stone-500"
                            }`}
                          >
                            {isSelected
                              ? wasInitiallySelected
                                ? "Linked"
                                : "This bot will be linked"
                              : wasInitiallySelected
                              ? "This bot will be unlinked"
                              : "Not Linked"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* No Bots State */}
              {bots.length === 0 && !loading && (
                <div className="text-center py-12 border border-dashed border-stone-700 rounded-lg">
                  <Bot className="h-12 w-12 text-stone-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-stone-300 mb-2">
                    No bots available
                  </h3>
                  <p className="text-stone-500 mb-4">
                    No bots are currently configured in the system
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-stone-800">
                <Link
                  href={`/dashboard/accounts/${account_id}`}
                  className={`px-4 py-2 ${STONE_Button} text-stone-300 rounded-lg text-sm transition-colors cursor-pointer`}
                >
                  Cancel
                </Link>

                <div className="flex gap-3">
                  {hasChanges && (
                    <button
                      onClick={handleResetChanges}
                      className={`px-4 py-2 ${STONE_Button} text-stone-300 rounded-lg text-sm transition-colors cursor-pointer`}
                      disabled={updating}
                    >
                      Reset Changes
                    </button>
                  )}

                  <button
                    onClick={handleUpdate}
                    disabled={updating || !hasChanges}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center text-sm gap-2 ${
                      updating || !hasChanges
                        ? "bg-blue-900/50 cursor-not-allowed"
                        : `${BLUE_Button} cursor-pointer`
                    } text-white transition-colors`}
                  >
                    {updating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3" />
                        Update Selection
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
