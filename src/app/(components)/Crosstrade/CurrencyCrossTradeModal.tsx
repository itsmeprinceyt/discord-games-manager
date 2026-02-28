"use client";
import { useState, useEffect, useCallback } from "react";
import { X, ArrowRight, Check, Loader2, ChevronDown } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import getAxiosErrorMessage from "../../../utils/Variables/getAxiosError.util";
import { BLUE_Button, STONE_Button } from "../../../utils/CSS/Button.util";

interface Account {
  id: string;
  name: string;
}

interface BotInfo {
  id: string;
  name: string;
  currency_name: string;
  balance: number;
}

interface CurrencyCrossTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentAccountId: string;
  currentAccountName: string;
}

export default function CurrencyCrossTradeModal({
  isOpen,
  onClose,
  onSuccess,
  currentAccountId,
  currentAccountName,
}: CurrencyCrossTradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingAccounts, setFetchingAccounts] = useState(false);
  const [fetchingFromBots, setFetchingFromBots] = useState(false);
  const [fetchingToBots, setFetchingToBots] = useState(false);

  const [accounts, setAccounts] = useState<Account[]>([]);

  const [fromAccountId, setFromAccountId] = useState(currentAccountId);
  const [toAccountId, setToAccountId] = useState(currentAccountId);

  const [fromBots, setFromBots] = useState<BotInfo[]>([]);
  const [toBots, setToBots] = useState<BotInfo[]>([]);

  const [selectedFromBot, setSelectedFromBot] = useState<BotInfo | null>(null);
  const [selectedToBot, setSelectedToBot] = useState<BotInfo | null>(null);

  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");

  const [tradedWith, setTradedWith] = useState("");
  const [tradeLink, setTradeLink] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const fetch = async () => {
      setFetchingAccounts(true);
      try {
        const res = await axios.get(
          `/api/dashboard/account/${currentAccountId}/currency-crosstrade/accounts`
        );
        if (res.data.success) setAccounts(res.data.data);
      } catch (err) {
        toast.error(getAxiosErrorMessage(err, "Failed to fetch accounts"));
      } finally {
        setFetchingAccounts(false);
      }
    };
    fetch();
  }, [currentAccountId, isOpen]);

  const fetchFromBots = useCallback(async (accountId: string) => {
    if (!accountId) return;
    setFetchingFromBots(true);
    setSelectedFromBot(null);
    setFromAmount("");
    try {
      const res = await axios.get(`/api/dashboard/account/${accountId}/wallet`);
      if (res.data.success) setFromBots(res.data.data);
    } catch (err) {
      toast.error(getAxiosErrorMessage(err, "Failed to fetch bots"));
    } finally {
      setFetchingFromBots(false);
    }
  }, []);

  const fetchToBots = useCallback(async (accountId: string) => {
    if (!accountId) return;
    setFetchingToBots(true);
    setSelectedToBot(null);
    setToAmount("");
    try {
      const res = await axios.get(`/api/dashboard/account/${accountId}/wallet`);
      if (res.data.success) setToBots(res.data.data);
    } catch (err) {
      toast.error(getAxiosErrorMessage(err, "Failed to fetch bots"));
    } finally {
      setFetchingToBots(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && fromAccountId) fetchFromBots(fromAccountId);
  }, [isOpen, fromAccountId, fetchFromBots]);

  useEffect(() => {
    if (isOpen && toAccountId) fetchToBots(toAccountId);
  }, [isOpen, toAccountId, fetchToBots]);

  useEffect(() => {
    if (!isOpen) {
      setFromAccountId(currentAccountId);
      setToAccountId(currentAccountId);
      setFromBots([]);
      setToBots([]);
      setSelectedFromBot(null);
      setSelectedToBot(null);
      setFromAmount("");
      setToAmount("");
      setTradedWith("");
      setTradeLink("");
      setNote("");
    }
  }, [isOpen, currentAccountId]);

  const handleFromAmountChange = (val: string) => {
    if (val === "" || /^\d+$/.test(val)) {
      if (selectedFromBot && parseInt(val) > selectedFromBot.balance) {
        setFromAmount(String(selectedFromBot.balance));
      } else {
        setFromAmount(val);
      }
    }
  };

  const handleToAmountChange = (val: string) => {
    if (val === "" || /^\d+$/.test(val)) {
      setToAmount(val);
    }
  };

  const fromAmountNum = parseInt(fromAmount) || 0;
  const toAmountNum = parseInt(toAmount) || 0;
  const newFromBalance = selectedFromBot
    ? selectedFromBot.balance - fromAmountNum
    : 0;
  const newToBalance = selectedToBot ? selectedToBot.balance + toAmountNum : 0;

  const canSubmit =
    selectedFromBot &&
    selectedToBot &&
    fromAmountNum > 0 &&
    toAmountNum > 0 &&
    fromAmountNum <= (selectedFromBot?.balance || 0) &&
    !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      const res = await axios.post(
        `/api/dashboard/account/${currentAccountId}/currency-crosstrade`,
        {
          from_bot_account_id: fromAccountId,
          from_selected_bot_id: selectedFromBot!.id,
          from_amount: fromAmountNum,
          to_bot_account_id: toAccountId,
          to_selected_bot_id: selectedToBot!.id,
          to_amount: toAmountNum,
          traded_with: tradedWith.trim() || null,
          trade_link: tradeLink.trim() || null,
          note: note.trim() || null,
        }
      );

      if (res.data.success) {
        toast.success("Currency crosstrade completed successfully!");
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      toast.error(getAxiosErrorMessage(err, "Failed to complete trade"));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getAccountName = (id: string) => {
    if (id === currentAccountId) return currentAccountName;
    return accounts.find((a) => a.id === id)?.name || id;
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-black/95 border border-stone-800 rounded-xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-800">
          <h2 className="text-xl font-medium text-white">
            New Currency Crosstrade
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5 text-stone-400" />
          </button>
        </div>

        <div className="p-6">
          {/* Two-panel trade area */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 mb-2">
            {/* LEFT — Giving Side */}
            <div className="bg-stone-900/40 border border-stone-700 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
                  Giving
                </span>
              </div>

              {/* From Account Selector */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-500">Account</label>
                <div className="relative">
                  <select
                    value={fromAccountId}
                    onChange={(e) => setFromAccountId(e.target.value)}
                    disabled={fetchingAccounts}
                    className={`w-full p-2.5 bg-stone-900/50 border border-stone-700 rounded-lg text-white text-sm focus:outline-none focus:border-stone-500 appearance-none cursor-pointer ${STONE_Button}`}
                  >
                    {fetchingAccounts ? (
                      <option>Loading...</option>
                    ) : (
                      <>
                        <option value={currentAccountId}>
                          {currentAccountName} (current)
                        </option>
                        {accounts
                          .filter((a) => a.id !== currentAccountId)
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                      </>
                    )}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500 pointer-events-none" />
                </div>
              </div>

              {/* From Bot Selector */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-500">Bot</label>
                {fetchingFromBots ? (
                  <div className="flex items-center gap-2 p-2.5 bg-stone-900/50 border border-stone-700 rounded-lg">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-stone-500" />
                    <span className="text-sm text-stone-500">
                      Loading bots...
                    </span>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedFromBot?.id || ""}
                      onChange={(e) => {
                        const bot =
                          fromBots.find((b) => b.id === e.target.value) || null;
                        setSelectedFromBot(bot);
                        setFromAmount("");
                      }}
                      className={`w-full p-2.5 bg-stone-900/50 border border-stone-700 rounded-lg text-white text-sm focus:outline-none focus:border-stone-500 appearance-none cursor-pointer`}
                    >
                      <option value="">Select a bot</option>
                      {fromBots.map((bot) => (
                        <option key={bot.id} value={bot.id}>
                          {bot.name} — {bot.balance} {bot.currency_name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* From Amount Input */}
              {selectedFromBot && (
                <div className="space-y-1.5">
                  <label className="text-xs text-stone-500">
                    Giving{" "}
                    <span className="text-red-400">
                      {selectedFromBot.currency_name}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={fromAmount}
                    onChange={(e) => handleFromAmountChange(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full p-2.5 bg-stone-900/50 border border-stone-700 rounded-lg text-white text-sm placeholder-stone-600 focus:outline-none focus:border-red-600"
                  />
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-500">Available:</span>
                    <span className="text-stone-300">
                      {selectedFromBot.balance} {selectedFromBot.currency_name}
                    </span>
                  </div>
                  {fromAmountNum > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-stone-500">After trade:</span>
                      <span
                        className={
                          newFromBalance < 0 ? "text-red-400" : "text-stone-300"
                        }
                      >
                        {newFromBalance} {selectedFromBot.currency_name}
                      </span>
                    </div>
                  )}
                  {fromAmountNum > selectedFromBot.balance && (
                    <p className="text-xs text-red-400">
                      Exceeds available balance
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Center arrow */}
            <div className="flex items-center justify-center lg:pt-16">
              <div className="p-3 bg-stone-900 border border-stone-700 rounded-full">
                <ArrowRight className="h-5 w-5 text-stone-400" />
              </div>
            </div>

            {/* RIGHT — Receiving Side */}
            <div className="bg-stone-900/40 border border-stone-700 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
                  Receiving
                </span>
              </div>

              {/* To Account Selector */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-500">Account</label>
                <div className="relative">
                  <select
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    disabled={fetchingAccounts}
                    className={`w-full p-2.5 bg-stone-900/50 border border-stone-700 rounded-lg text-white text-sm focus:outline-none focus:border-stone-500 appearance-none cursor-pointer`}
                  >
                    {fetchingAccounts ? (
                      <option>Loading...</option>
                    ) : (
                      <>
                        <option value={currentAccountId}>
                          {currentAccountName} (current)
                        </option>
                        {accounts
                          .filter((a) => a.id !== currentAccountId)
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                      </>
                    )}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500 pointer-events-none" />
                </div>
              </div>

              {/* To Bot Selector */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-500">Bot</label>
                {fetchingToBots ? (
                  <div className="flex items-center gap-2 p-2.5 bg-stone-900/50 border border-stone-700 rounded-lg">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-stone-500" />
                    <span className="text-sm text-stone-500">
                      Loading bots...
                    </span>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedToBot?.id || ""}
                      onChange={(e) => {
                        const bot =
                          toBots.find((b) => b.id === e.target.value) || null;
                        setSelectedToBot(bot);
                        setToAmount("");
                      }}
                      className={`w-full p-2.5 bg-stone-900/50 border border-stone-700 rounded-lg text-white text-sm focus:outline-none focus:border-stone-500 appearance-none cursor-pointer`}
                    >
                      <option value="">Select a bot</option>
                      {toBots.map((bot) => (
                        <option key={bot.id} value={bot.id}>
                          {bot.name} — {bot.balance} {bot.currency_name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* To Amount Input */}
              {selectedToBot && (
                <div className="space-y-1.5">
                  <label className="text-xs text-stone-500">
                    Receiving{" "}
                    <span className="text-green-400">
                      {selectedToBot.currency_name}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={toAmount}
                    onChange={(e) => handleToAmountChange(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full p-2.5 bg-stone-900/50 border border-stone-700 rounded-lg text-white text-sm placeholder-stone-600 focus:outline-none focus:border-green-600"
                  />
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-500">Current balance:</span>
                    <span className="text-stone-300">
                      {selectedToBot.balance} {selectedToBot.currency_name}
                    </span>
                  </div>
                  {toAmountNum > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-stone-500">After trade:</span>
                      <span className="text-green-400">
                        {newToBalance} {selectedToBot.currency_name}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Trade summary */}
          {selectedFromBot &&
            selectedToBot &&
            fromAmountNum > 0 &&
            toAmountNum > 0 && (
              <div className="my-4 p-4 bg-stone-900/50 border border-stone-700 rounded-lg">
                <p className="text-xs text-stone-500 mb-2 uppercase tracking-wider">
                  Trade Summary
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-white">
                    Giving{" "}
                    <span className="text-red-400 font-medium">
                      {fromAmountNum}{" "}
                      {fromAmountNum > 1
                        ? `${selectedFromBot.currency_name}s`
                        : selectedFromBot.currency_name}
                    </span>{" "}
                    from{" "}
                    <span className="text-stone-300 italic">
                      &apos;{getAccountName(fromAccountId)}&apos; ({" "}
                      {selectedFromBot.name} )
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-stone-600 shrink-0" />
                  <span className="text-sm text-white">
                    Receiving{" "}
                    <span className="text-green-400 font-medium">
                      {toAmountNum}{" "}
                      {toAmountNum > 1
                        ? `${selectedToBot.currency_name}s`
                        : selectedToBot.currency_name}
                    </span>{" "}
                    in{" "}
                    <span className="text-stone-300 italic">
                      &apos;{getAccountName(toAccountId)}&apos; ({" "}
                      {selectedToBot.name} )
                    </span>
                  </span>
                </div>
              </div>
            )}

          {/* Optional fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
            <div className="space-y-1.5">
              <label className="text-xs text-stone-500">Buyer ID</label>
              <input
                type="text"
                value={tradedWith}
                onChange={(e) => setTradedWith(e.target.value)}
                placeholder="User ID of the buyer (optional)"
                className="w-full p-2.5 bg-stone-900/50 border border-stone-700 rounded-lg text-white text-sm placeholder-stone-600 focus:outline-none focus:border-stone-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-stone-500">Trade Link</label>
              <input
                type="url"
                value={tradeLink}
                onChange={(e) => setTradeLink(e.target.value)}
                placeholder="Trade link (optional)"
                className="w-full p-2.5 bg-stone-900/50 border border-stone-700 rounded-lg text-white text-sm placeholder-stone-600 focus:outline-none focus:border-stone-500"
              />
            </div>
          </div>

          <label className="text-xs text-stone-500">Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-2.5 bg-stone-900/50 border border-stone-700 rounded-lg text-white text-sm placeholder-stone-600 focus:outline-none focus:border-stone-500"
            placeholder="Additional notes about this trade"
          />

          {/* Footer buttons */}
          <div className="flex gap-3 pt-4 mt-4 border-t border-stone-800">
            <button
              onClick={onClose}
              disabled={loading}
              className={`flex-1 p-3 ${STONE_Button} text-stone-300 rounded-lg transition-colors cursor-pointer disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`flex-1 p-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                canSubmit
                  ? `${BLUE_Button} text-white cursor-pointer`
                  : "bg-blue-900/30 text-blue-700 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Submit
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
