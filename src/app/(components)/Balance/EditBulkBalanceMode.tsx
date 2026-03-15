"use client";
import { useState, useEffect } from "react";
import {
  X,
  Loader2,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { BLUE_Button, STONE_Button } from "../../../utils/CSS/Button.util";
import axios from "axios";

interface BotBalance {
  id: string;
  name: string;
  currency_name: string;
  balance: number;
}

interface BulkEditBalanceModalProps {
  account_id: string;
  isOpen: boolean;
  onClose: () => void;
  bots: BotBalance[];
  onUpdate?: () => Promise<void>;
}

interface EditedBalance {
  botId: string;
  originalBalance: number;
  newBalance: number;
  isEdited: boolean;
}

export default function BulkEditBalanceModal({
  account_id,
  isOpen,
  onClose,
  bots,
  onUpdate,
}: BulkEditBalanceModalProps) {
  const [editedBalances, setEditedBalances] = useState<
    Record<string, EditedBalance>
  >({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  useEffect(() => {
    if (isOpen && bots.length > 0) {
      const initial: Record<string, EditedBalance> = {};
      bots.forEach((bot) => {
        initial[bot.id] = {
          botId: bot.id,
          originalBalance: bot.balance,
          newBalance: bot.balance,
          isEdited: false,
        };
      });
      setEditedBalances(initial);
      setError("");
      setSuccess("");
    }
  }, [isOpen, bots]);

  const handleBalanceChange = (botId: string, value: string) => {
    const numValue = parseFloat(value);
    const original = editedBalances[botId]?.originalBalance;

    setEditedBalances((prev) => ({
      ...prev,
      [botId]: {
        ...prev[botId],
        newBalance: isNaN(numValue) ? 0 : numValue,
        isEdited: original !== (isNaN(numValue) ? 0 : numValue),
      },
    }));
  };

  const handleReset = (botId: string) => {
    setEditedBalances((prev) => ({
      ...prev,
      [botId]: {
        ...prev[botId],
        newBalance: prev[botId].originalBalance,
        isEdited: false,
      },
    }));
  };

  const handleResetAll = () => {
    const reset: Record<string, EditedBalance> = {};
    Object.keys(editedBalances).forEach((botId) => {
      reset[botId] = {
        ...editedBalances[botId],
        newBalance: editedBalances[botId].originalBalance,
        isEdited: false,
      };
    });
    setEditedBalances(reset);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const editedBots = Object.values(editedBalances).filter((b) => b.isEdited);

    if (editedBots.length === 0) {
      setError("No changes to save");
      return;
    }

    for (const bot of editedBots) {
      if (bot.newBalance < 0) {
        const botName = bots.find((b) => b.id === bot.botId)?.name || "Bot";
        setError(`${botName} balance cannot be negative`);
        return;
      }
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.put(
        `/api/dashboard/account/${account_id}/wallet/bulk-update`,
        {
          updates: editedBots.map((bot) => ({
            bot_id: bot.botId,
            balance: bot.newBalance,
          })),
        }
      );

      if (response.data.success) {
        if (onUpdate) {
          await onUpdate();
        }
        onClose();
      }
    } catch (error) {
      console.error("Error updating balances:", error);
      setError("Failed to update balances. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const getEditedCount = () => {
    return Object.values(editedBalances).filter((b) => b.isEdited).length;
  };

  const getCurrencyColor = (currencyName: string) => {
    const colorMap: Record<string, string> = {
      Ticket: "text-orange-400",
      Jade: "text-emerald-400",
      Wist: "text-purple-400",
    };
    return colorMap[currencyName] || "text-stone-400";
  };

  if (!isOpen) return null;

  const editedCount = getEditedCount();
  const hasChanges = editedCount > 0;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-black/90 border border-stone-800 rounded-xl max-w-4xl w-full flex flex-col max-h-[90vh]">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 shrink-0">
          <div>
            <h2 className="text-xl font-medium text-white">
              Bulk Edit Balances
            </h2>
            <p className="text-sm text-stone-400 mt-1">
              Edit multiple bot balances at once
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-stone-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <X className="h-5 w-5 text-stone-400" />
          </button>
        </div>

        {/* Form - Takes remaining height with proper scrolling */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Bots List - Scrollable */}
          <div className="overflow-y-auto px-6 py-4 flex-1 min-h-0">
            <div className="space-y-4">
              {bots.map((bot) => {
                const edited = editedBalances[bot.id];
                const isEdited = edited?.isEdited;
                const currencyColor = getCurrencyColor(bot.currency_name);

                return (
                  <div
                    key={bot.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      isEdited
                        ? "border-blue-600 bg-blue-900/10"
                        : "border-stone-800 hover:border-stone-700"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-medium">{bot.name}</h3>
                        <p className="text-stone-500 text-xs">ID: {bot.id}</p>
                      </div>
                      {isEdited && (
                        <button
                          type="button"
                          onClick={() => handleReset(bot.id)}
                          className="text-xs text-stone-400 hover:text-white px-2 py-1 rounded hover:bg-stone-800 transition-colors"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Current Balance */}
                      <div>
                        <label className="block text-xs text-stone-400 mb-1">
                          Current Balance
                        </label>
                        <div className="flex items-baseline gap-1 p-2.5 bg-stone-900/30 border border-stone-800 rounded-lg">
                          <span
                            className={`text-lg font-bold ${currencyColor}`}
                          >
                            {bot.balance}
                          </span>
                          <span className={`text-sm ${currencyColor}`}>
                            {bot.balance > 1
                              ? `${bot.currency_name}s`
                              : bot.currency_name}
                          </span>
                        </div>
                      </div>

                      {/* New Balance */}
                      <div>
                        <label className="block text-xs text-stone-400 mb-1">
                          New Balance
                        </label>
                        <input
                          type="number"
                          value={edited?.newBalance ?? bot.balance}
                          onChange={(e) =>
                            handleBalanceChange(bot.id, e.target.value)
                          }
                          min="0"
                          step="1"
                          className={`w-full p-2.5 bg-stone-900/50 border rounded-lg text-white placeholder-stone-500 focus:outline-none focus:border-blue-600 cursor-text ${
                            isEdited ? "border-blue-600" : "border-stone-700"
                          }`}
                          placeholder="Enter new balance"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="border-t border-stone-800 bg-stone-900/50 shrink-0">
            {/* Summary Bar - Shows when changes exist */}
            {hasChanges && (
              <div className="px-6 py-3 border-b border-stone-800 bg-stone-900/30 text-blue-400 text-[12px] italic">
                {editedCount} bot(s) edited
              </div>
            )}

            {/* Status Messages */}
            <div className="px-6 pt-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded-lg mb-4">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-800 rounded-lg mb-4">
                  <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                  <p className="text-sm text-green-400">{success}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="px-6 pb-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Left Section - Reset and Info */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <button
                    type="button"
                    onClick={handleResetAll}
                    disabled={loading || !hasChanges}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2 ${STONE_Button} text-stone-300 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-full sm:w-auto`}
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Reset All</span>
                  </button>
                  {!hasChanges && (
                    <span className="text-xs text-stone-500 italic">
                      No changes to save
                    </span>
                  )}
                </div>

                {/* Right Section - Cancel and Save */}
                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className={`inline-flex items-center justify-center px-5 py-2 ${STONE_Button} text-stone-300 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-full sm:w-auto`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !hasChanges}
                    className={`inline-flex items-center justify-center gap-2 px-6 py-2 ${BLUE_Button} text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-full sm:w-auto min-w-35`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
