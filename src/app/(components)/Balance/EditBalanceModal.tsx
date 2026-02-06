"use client";
import { useState, useEffect } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { BLUE_Button } from "../../../utils/CSS/Button.util";
import axios from "axios";

interface BotBalance {
  id: string;
  name: string;
  currency_name: string;
  balance: number;
}

interface EditBalanceModalProps {
  account_id: string;
  isOpen: boolean;
  onClose: () => void;
  bot: BotBalance | null;
  onUpdate?: (botId: string, newBalance: number) => Promise<void>;
}

export default function EditBalanceModal({
  account_id,
  isOpen,
  onClose,
  bot,
  onUpdate,
}: EditBalanceModalProps) {
  const [balance, setBalance] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (bot) {
      setBalance(bot.balance.toString());
      setError("");
    }
  }, [bot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bot) return;

    const numBalance = parseFloat(balance);
    if (isNaN(numBalance)) {
      setError("Please enter a valid number");
      return;
    }

    if (numBalance < 0) {
      setError("Balance cannot be negative");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.put(
        `/api/dashboard/account/${account_id}/wallet/update-balance`,
        {
          bot_id: bot.id,
          balance: numBalance,
        }
      );

      if (response.data.success) {
        if (onUpdate) {
          await onUpdate(bot.id, numBalance);
        }
      }

      onClose();
    } catch (error) {
      console.error("Error updating balance:", error);
      setError("Failed to update balance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen || !bot) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-black/90 border border-stone-800 rounded-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between  px-6 py-3 border-b border-stone-800">
          <h2 className="text-xl font-medium text-white">
            Edit {bot.name} Balance
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-stone-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <X className="h-5 w-5 text-stone-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Balance Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-300">
              Enter the new balance in {bot.currency_name}
              <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              value={balance}
              onChange={(e) => {
                setBalance(e.target.value);
                setError("");
              }}
              min="0"
              step="0.01"
              className="w-full p-2.5 bg-stone-900/50 border border-stone-700 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:border-blue-600 cursor-text"
              placeholder="Enter new balance"
              required
              disabled={loading}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          {/* Submit Buttons */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full p-3 ${BLUE_Button} text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Update Balance
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
