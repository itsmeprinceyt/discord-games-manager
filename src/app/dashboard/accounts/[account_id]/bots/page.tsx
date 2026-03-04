"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import PageWrapper from "../../../../(components)/PageWrapper";
import {
  Check,
  X,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Bot,
  Ban,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import getAxiosErrorMessage from "../../../../../utils/Variables/getAxiosError.util";
import {
  BLUE_Button,
  STONE_Button,
} from "../../../../../utils/CSS/Button.util";
import Loader from "../../../../(components)/Loader";

interface BotSelection {
  id: string;
  name: string;
  currency: string;
  isSelected: boolean;
  selectedBotId?: string;
  blacklisted?: boolean;
}

export default function BotSelectionPage() {
  const { account_id } = useParams();
  const [bots, setBots] = useState<BotSelection[]>([]);
  const [selectedBots, setSelectedBots] = useState<string[]>([]);
  const [blacklistedBots, setBlacklistedBots] = useState<
    Record<string, boolean>
  >({});
  const [initialSelectedBots, setInitialSelectedBots] = useState<string[]>([]);
  const [initialBlacklistedBots, setInitialBlacklistedBots] = useState<
    Record<string, boolean>
  >({});
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

        // Initialize blacklist status for selected bots only
        const blacklistState: Record<string, boolean> = {};
        botsData.forEach((bot: BotSelection) => {
          if (bot.isSelected && bot.selectedBotId) {
            blacklistState[bot.selectedBotId] = bot.blacklisted || false;
          }
        });
        setBlacklistedBots(blacklistState);
        setInitialBlacklistedBots(blacklistState);
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
    const selectionChanged =
      JSON.stringify(sortedSelected) !== JSON.stringify(sortedInitial);

    // Check if blacklist status changed for any bot
    const blacklistChanged = Object.keys(blacklistedBots).some(
      (botId) => blacklistedBots[botId] !== initialBlacklistedBots[botId]
    );

    setHasChanges(selectionChanged || blacklistChanged);
  }, [
    selectedBots,
    initialSelectedBots,
    blacklistedBots,
    initialBlacklistedBots,
  ]);

  const toggleBotSelection = (botId: string) => {
    setSelectedBots((prev) => {
      if (prev.includes(botId)) {
        return prev.filter((id) => id !== botId);
      } else {
        return [...prev, botId];
      }
    });
  };

  const toggleBlacklist = (
    selectedBotId: string,
    currentStatus: boolean,
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // Prevent triggering the parent div's onClick

    setBlacklistedBots((prev) => ({
      ...prev,
      [selectedBotId]: !currentStatus,
    }));
  };

  const handleSelectAll = () => {
    setSelectedBots(bots.map((bot) => bot.id));
  };

  const handleDeselectAll = () => {
    setSelectedBots([]);
  };

  const handleResetChanges = () => {
    setSelectedBots([...initialSelectedBots]);
    setBlacklistedBots({ ...initialBlacklistedBots });
  };

  const handleUpdate = async () => {
    if (!hasChanges) {
      toast.error("No changes to save");
      return;
    }

    setUpdating(true);
    try {
      // Prepare blacklist updates for existing bots only
      const blacklistUpdates = Object.keys(blacklistedBots)
        .filter((selectedBotId) => {
          // Only include if status changed AND bot is still selected
          const wasChanged =
            blacklistedBots[selectedBotId] !==
            initialBlacklistedBots[selectedBotId];
          const bot = bots.find((b) => b.selectedBotId === selectedBotId);
          return wasChanged && bot && selectedBots.includes(bot.id);
        })
        .map((selectedBotId) => ({
          selectedBotId,
          blacklisted: blacklistedBots[selectedBotId],
        }));

      const response = await axios.post(
        `/api/dashboard/account/${account_id}/bot-manage/update`,
        {
          botIds: selectedBots,
          botAccountId: account_id,
          ...(blacklistUpdates.length > 0 && { blacklistUpdates }),
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Changes saved successfully!");
        setInitialSelectedBots([...selectedBots]);
        setInitialBlacklistedBots({ ...blacklistedBots });
        setHasChanges(false);
        await fetchAvailableBots(); // Refresh to get latest data
      }
    } catch (error: unknown) {
      toast.error(getAxiosErrorMessage(error, "Failed to update bots"));
    } finally {
      setUpdating(false);
    }
  };

  const selectedCount = selectedBots.length;
  const totalCount = bots.length;
  const blacklistedCount = Object.values(blacklistedBots).filter(
    (v) => v
  ).length;

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
                <h1 className="text-2xl md:text-3xl font-medium text-white">
                  Manage Bots
                  {hasChanges && (
                    <span className="ml-2 text-yellow-400 text-sm">
                      (Unsaved changes)
                    </span>
                  )}
                </h1>
                <p className="text-stone-400 text-sm">
                  Select bots to associate with this account and manage
                  blacklist status
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

              {blacklistedCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-900/20 border border-red-800 rounded-lg">
                  <Ban className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-red-400">
                    {blacklistedCount} blacklisted bot
                    {blacklistedCount !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

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
            <Loader />
          ) : (
            <>
              {/* Bots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {bots.map((bot) => {
                  const isSelected = selectedBots.includes(bot.id);
                  const wasInitiallySelected = initialSelectedBots.includes(
                    bot.id
                  );
                  const isBlacklisted = bot.selectedBotId
                    ? blacklistedBots[bot.selectedBotId]
                    : false;

                  // Determine card border color based on state
                  let borderColor = "border-stone-800";
                  let bgColor = "";
                  if (isSelected) {
                    if (wasInitiallySelected) {
                      borderColor = isBlacklisted
                        ? "border-red-600"
                        : "border-green-600";
                      bgColor = isBlacklisted
                        ? "bg-red-900/10"
                        : "bg-green-900/10";
                    } else {
                      borderColor = isBlacklisted
                        ? "border-red-600"
                        : "border-blue-600";
                      bgColor = isBlacklisted
                        ? "bg-red-900/10"
                        : "bg-blue-900/10";
                    }
                  } else if (wasInitiallySelected) {
                    borderColor = "border-red-600";
                    bgColor = "bg-red-900/10";
                  }

                  return (
                    <div
                      key={bot.id}
                      className={`bg-stone-950 border rounded-xl p-5 transition-all duration-200 cursor-pointer hover:scale-[1.02] ${borderColor} ${bgColor}`}
                      onClick={() => toggleBotSelection(bot.id)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              isSelected
                                ? wasInitiallySelected
                                  ? isBlacklisted
                                    ? "bg-red-600/30"
                                    : "bg-green-600/30"
                                  : isBlacklisted
                                  ? "bg-red-600/30"
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
                                    ? isBlacklisted
                                      ? "text-red-400"
                                      : "text-green-400"
                                    : isBlacklisted
                                    ? "text-red-400"
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
                            {isBlacklisted && (
                              <span className="text-xs text-red-400 flex items-center gap-1 mt-1">
                                <Ban className="h-3 w-3" />
                                Blacklisted
                              </span>
                            )}
                          </div>
                        </div>
                        <div
                          className={`p-1.5 rounded-full ${
                            isSelected
                              ? wasInitiallySelected
                                ? isBlacklisted
                                  ? "bg-red-600"
                                  : "bg-green-600"
                                : isBlacklisted
                                ? "bg-red-600"
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
                                  ? isBlacklisted
                                    ? "text-red-400"
                                    : "text-green-400"
                                  : isBlacklisted
                                  ? "text-red-400"
                                  : "text-blue-400"
                                : wasInitiallySelected
                                ? "text-red-400"
                                : "text-stone-500"
                            }`}
                          >
                            {isSelected
                              ? wasInitiallySelected
                                ? isBlacklisted
                                  ? "Blacklisted"
                                  : "Linked"
                                : isBlacklisted
                                ? "Will be blacklisted"
                                : "Will be linked"
                              : wasInitiallySelected
                              ? "Will be unlinked"
                              : "Not Linked"}
                          </span>
                        </div>

                        {/* Blacklist Toggle - Only show for selected bots */}
                        {isSelected && bot.selectedBotId && (
                          <div className="pt-3 mt-3 border-t border-stone-800">
                            <div
                              className="flex items-center justify-between cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="text-sm text-stone-400 flex items-center gap-2">
                                <Ban className="h-4 w-4" />
                                Blacklisted?
                              </span>
                              <button
                                onClick={(e) =>
                                  toggleBlacklist(
                                    bot.selectedBotId!,
                                    isBlacklisted,
                                    e
                                  )
                                }
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                                  isBlacklisted ? "bg-red-600" : "bg-stone-700"
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    isBlacklisted
                                      ? "translate-x-6"
                                      : "translate-x-1"
                                  }`}
                                />
                              </button>
                            </div>
                            {isBlacklisted && (
                              <p className="text-xs text-red-400 mt-2">
                                Blacklisted bots won&apos;t appear in UI
                              </p>
                            )}
                          </div>
                        )}
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
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3" />
                        Save Changes
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
