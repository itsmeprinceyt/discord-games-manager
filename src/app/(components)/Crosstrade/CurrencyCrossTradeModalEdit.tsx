"use client";
import { useState, useEffect, useCallback } from "react";
import { X, Check, Loader2, ChevronDown, Calendar, Lock } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import getAxiosErrorMessage from "../../../utils/Variables/getAxiosError.util";
import { BLUE_Button, STONE_Button } from "../../../utils/CSS/Button.util";
import { CURRENCY_LIMIT } from "../../../utils/main.util";
import { CurrencyCrossTrade } from "../../api/dashboard/account/[account_id]/currency-crosstrade/route";

interface BotInfo {
  id: string;
  name: string;
  currency_name: string;
}

interface CurrencyCrossTradeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  trade: CurrencyCrossTrade;
  currentAccountId: string;
}

// ── Date helpers ───────────────────────────────────────────────────────────────
const getLocalDateTimeString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatDateTimeForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const validateDateTimeString = (dateTimeString: string): string => {
  if (!dateTimeString) return "Date and time are required";
  const dateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
  if (!dateTimePattern.test(dateTimeString)) return "Invalid date/time format";
  const [datePart, timePart] = dateTimeString.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  if (year < 1000 || year > 9999) return "Year must be between 1000 and 9999";
  if (month < 1 || month > 12) return "Month must be between 01 and 12";
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth)
    return `Day must be between 01 and ${daysInMonth} for month ${month}`;
  if (hours < 0 || hours > 23) return "Hour must be between 00 and 23";
  if (minutes < 0 || minutes > 59) return "Minutes must be between 00 and 59";
  const date = new Date(dateTimeString);
  if (isNaN(date.getTime())) return "Invalid date/time";
  return "";
};

const toInputDateTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return getLocalDateTimeString();
    return formatDateTimeForInput(date);
  } catch {
    return getLocalDateTimeString();
  }
};

export default function CurrencyCrossTradeEditModal({
  isOpen,
  onClose,
  onSuccess,
  trade,
  currentAccountId,
}: CurrencyCrossTradeEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingFromBots, setFetchingFromBots] = useState(false);
  const [fetchingToBots, setFetchingToBots] = useState(false);

  const [fromBots, setFromBots] = useState<BotInfo[]>([]);
  const [toBots, setToBots] = useState<BotInfo[]>([]);

  const [selectedFromBotId, setSelectedFromBotId] = useState<string>(
    trade.from_selected_bot_id
  );
  const [selectedToBotId, setSelectedToBotId] = useState<string>(
    trade.to_selected_bot_id
  );

  const [fromAmount, setFromAmount] = useState<string>(
    String(trade.from_amount)
  );
  const [toAmount, setToAmount] = useState<string>(String(trade.to_amount));

  const [crosstradeDate, setCrosstradeDate] = useState<string>(
    toInputDateTime(trade.crosstrade_date)
  );
  const [dateError, setDateError] = useState<string>("");

  const [tradedWith, setTradedWith] = useState(trade.traded_with || "");
  const [tradeWithName, setTradeWithName] = useState(
    trade.trade_with_name || ""
  );
  const [tradeLink, setTradeLink] = useState(trade.trade_link || "");
  const [tradeLinkSecond, setTradeLinkSecond] = useState(
    trade.trade_link_second || ""
  );
  const [note, setNote] = useState(trade.note || "");

  const fetchFromBots = useCallback(async () => {
    setFetchingFromBots(true);
    try {
      const res = await axios.get(
        `/api/dashboard/account/${trade.from_bot_account_id}/wallet`
      );
      if (res.data.success) setFromBots(res.data.data);
    } catch (err) {
      toast.error(getAxiosErrorMessage(err, "Failed to fetch giving bots"));
    } finally {
      setFetchingFromBots(false);
    }
  }, [trade.from_bot_account_id]);

  const fetchToBots = useCallback(async () => {
    setFetchingToBots(true);
    try {
      const res = await axios.get(
        `/api/dashboard/account/${trade.to_bot_account_id}/wallet`
      );
      if (res.data.success) setToBots(res.data.data);
    } catch (err) {
      toast.error(getAxiosErrorMessage(err, "Failed to fetch receiving bots"));
    } finally {
      setFetchingToBots(false);
    }
  }, [trade.to_bot_account_id]);

  useEffect(() => {
    if (isOpen) {
      fetchFromBots();
      fetchToBots();
    }
  }, [isOpen, fetchFromBots, fetchToBots]);

  // Reset state when trade changes (e.g. opening a different trade)
  useEffect(() => {
    if (isOpen) {
      setSelectedFromBotId(trade.from_selected_bot_id);
      setSelectedToBotId(trade.to_selected_bot_id);
      setFromAmount(String(trade.from_amount));
      setToAmount(String(trade.to_amount));
      setCrosstradeDate(toInputDateTime(trade.crosstrade_date));
      setDateError("");
      setTradedWith(trade.traded_with || "");
      setTradeWithName(trade.trade_with_name || "");
      setTradeLink(trade.trade_link || "");
      setTradeLinkSecond(trade.trade_link_second || "");
      setNote(trade.note || "");
    }
  }, [isOpen, trade]);

  const handleFromAmountChange = (val: string) => {
    if (val === "" || /^\d+$/.test(val)) {
      setFromAmount(
        parseInt(val) > CURRENCY_LIMIT ? String(CURRENCY_LIMIT) : val
      );
    }
  };

  const handleToAmountChange = (val: string) => {
    if (val === "" || /^\d+$/.test(val)) {
      setToAmount(val);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCrosstradeDate(val);
    setDateError(validateDateTimeString(val));
  };

  const handleDateBlur = () => {
    const date = new Date(crosstradeDate);
    if (isNaN(date.getTime())) {
      setCrosstradeDate(getLocalDateTimeString());
      setDateError("");
    } else {
      const formatted = formatDateTimeForInput(date);
      setCrosstradeDate(formatted);
      setDateError(validateDateTimeString(formatted));
    }
  };

  const fromAmountNum = parseInt(fromAmount) || 0;
  const toAmountNum = parseInt(toAmount) || 0;

  const selectedFromBot = fromBots.find((b) => b.id === selectedFromBotId);
  const selectedToBot = toBots.find((b) => b.id === selectedToBotId);

  const canSubmit =
    selectedFromBotId &&
    selectedToBotId &&
    fromAmountNum > 0 &&
    toAmountNum > 0 &&
    !dateError &&
    !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const err = validateDateTimeString(crosstradeDate);
    if (err) {
      setDateError(err);
      toast.error("Please enter a valid crosstrade date");
      return;
    }

    const localDate = new Date(crosstradeDate);
    if (isNaN(localDate.getTime())) {
      toast.error("Invalid date selected");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.put(
        `/api/dashboard/account/${currentAccountId}/currency-crosstrade/${trade.id}`,
        {
          from_selected_bot_id: selectedFromBotId,
          from_amount: fromAmountNum,
          to_selected_bot_id: selectedToBotId,
          to_amount: toAmountNum,
          crosstrade_date: localDate.toISOString(),
          traded_with: tradedWith.trim() || null,
          trade_with_name: tradeWithName.trim() || null,
          trade_link: tradeLink.trim() || null,
          trade_link_second: tradeLinkSecond.trim() || null,
          note: note.trim() || null,
        }
      );

      if (res.data.success) {
        toast.success("Currency crosstrade updated successfully!");
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      toast.error(getAxiosErrorMessage(err, "Failed to update trade"));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-black/95 border border-stone-800 rounded-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-medium text-white">
              Edit Currency Crosstrade
            </h2>
            <span className="px-2 py-1 bg-blue-900/30 text-blue-400 text-xs rounded border border-blue-800">
              #{trade.id}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5 text-stone-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Locked info banner */}
          <div className="p-3 bg-stone-900/60 border border-stone-700 rounded-lg flex items-start gap-2">
            <Lock className="h-4 w-4 text-stone-500 mt-0.5 shrink-0" />
            <div className="text-xs text-stone-500 space-y-0.5">
              <p>
                <span className="text-stone-400 font-medium">
                  Giving account:
                </span>{" "}
                {trade.from_bot_account_name}
              </p>
              <p>
                <span className="text-stone-400 font-medium">
                  Receiving account:
                </span>{" "}
                {trade.to_bot_account_name}
              </p>
              <p className="text-stone-600 text-xs mt-1">
                Accounts are locked. Only bots and amounts within those accounts
                can be changed.
              </p>
            </div>
          </div>

          {/* Crosstrade Date */}
          <div className="space-y-1.5">
            <label className="text-xs text-stone-500">
              Crosstrade Date <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500 pointer-events-none" />
              <input
                type="datetime-local"
                value={crosstradeDate}
                onChange={handleDateChange}
                onBlur={handleDateBlur}
                min="2020-01-01T00:00"
                max="2100-12-31T23:59"
                step="60"
                className={`w-full pl-10 pr-4 py-2.5 bg-stone-900/50 border ${
                  dateError ? "border-red-600" : "border-stone-700"
                } rounded-lg text-white text-sm focus:outline-none focus:border-blue-600 cursor-pointer`}
              />
            </div>
            {dateError && <p className="text-xs text-red-500">{dateError}</p>}
          </div>

          {/* Two-column bot/amount section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Giving Side */}
            <div className="bg-stone-900/40 border border-stone-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
                  Giving
                </span>
                <span className="text-xs text-stone-600">
                  ({trade.from_bot_account_name})
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-stone-500">Bot</label>
                {fetchingFromBots ? (
                  <div className="flex items-center gap-2 p-2.5 bg-stone-900/50 border border-stone-700 rounded-lg">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-stone-500" />
                    <span className="text-sm text-stone-500">Loading...</span>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedFromBotId}
                      onChange={(e) => setSelectedFromBotId(e.target.value)}
                      className="w-full p-2.5 bg-stone-900/50 border border-stone-700 rounded-lg text-white text-sm focus:outline-none focus:border-stone-500 appearance-none cursor-pointer"
                    >
                      {fromBots.map((bot) => (
                        <option key={bot.id} value={bot.id}>
                          {bot.name} — {bot.currency_name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500 pointer-events-none" />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-stone-500">
                  Currency:{" "}
                  {selectedFromBot && (
                    <span className="text-red-400">
                      {selectedFromBot.currency_name}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={fromAmount}
                  onChange={(e) => handleFromAmountChange(e.target.value)}
                  placeholder="Enter amount"
                  maxLength={String(CURRENCY_LIMIT).length}
                  className="w-full p-2.5 bg-stone-900/50 border border-stone-700 rounded-lg text-white text-sm placeholder-stone-600 focus:outline-none focus:border-red-600"
                />
              </div>
            </div>

            {/* Receiving Side */}
            <div className="bg-stone-900/40 border border-stone-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
                  Receiving
                </span>
                <span className="text-xs text-stone-600">
                  ({trade.to_bot_account_name})
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-stone-500">Bot</label>
                {fetchingToBots ? (
                  <div className="flex items-center gap-2 p-2.5 bg-stone-900/50 border border-stone-700 rounded-lg">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-stone-500" />
                    <span className="text-sm text-stone-500">Loading...</span>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedToBotId}
                      onChange={(e) => setSelectedToBotId(e.target.value)}
                      className="w-full p-2.5 bg-stone-900/50 border border-stone-700 rounded-lg text-white text-sm focus:outline-none focus:border-stone-500 appearance-none cursor-pointer"
                    >
                      {toBots.map((bot) => (
                        <option key={bot.id} value={bot.id}>
                          {bot.name} — {bot.currency_name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500 pointer-events-none" />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-stone-500">
                  Currency:{" "}
                  {selectedToBot && (
                    <span className="text-green-400">
                      {selectedToBot.currency_name}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={toAmount}
                  onChange={(e) => handleToAmountChange(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full p-2.5 bg-stone-900/50 border border-stone-700 rounded-lg text-white text-sm placeholder-stone-600 focus:outline-none focus:border-green-600"
                />
              </div>
            </div>
          </div>

          {/* Optional meta fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-stone-500">
                Buyer ID <span className="text-stone-600">(optional)</span>
              </label>
              <input
                type="text"
                value={tradedWith}
                onChange={(e) => setTradedWith(e.target.value)}
                maxLength={36}
                placeholder="User ID of the buyer"
                className="w-full p-2.5 bg-stone-900/50 border border-stone-700 rounded-lg text-white text-sm placeholder-stone-600 focus:outline-none focus:border-stone-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-stone-500">
                Buyer Name <span className="text-stone-600">(optional)</span>
              </label>
              <input
                type="text"
                value={tradeWithName}
                onChange={(e) => setTradeWithName(e.target.value)}
                maxLength={50}
                placeholder="Display name of the buyer"
                className="w-full p-2.5 bg-stone-900/50 border border-stone-700 rounded-lg text-white text-sm placeholder-stone-600 focus:outline-none focus:border-stone-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-stone-500">
                Trade Link <span className="text-stone-600">(optional)</span>
              </label>
              <input
                type="url"
                value={tradeLink}
                onChange={(e) => setTradeLink(e.target.value)}
                maxLength={100}
                placeholder="Primary trade link"
                className="w-full p-2.5 bg-stone-900/50 border border-stone-700 rounded-lg text-white text-sm placeholder-stone-600 focus:outline-none focus:border-stone-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-stone-500">
                Trade Link 2 <span className="text-stone-600">(optional)</span>
              </label>
              <input
                type="url"
                value={tradeLinkSecond}
                onChange={(e) => setTradeLinkSecond(e.target.value)}
                maxLength={100}
                placeholder="Secondary trade link"
                className="w-full p-2.5 bg-stone-900/50 border border-stone-700 rounded-lg text-white text-sm placeholder-stone-600 focus:outline-none focus:border-stone-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-stone-500">
              Note <span className="text-stone-600">(optional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={250}
              className="w-full p-2.5 bg-stone-900/50 border border-stone-700 rounded-lg text-white text-sm placeholder-stone-600 focus:outline-none focus:border-stone-500"
              placeholder="Additional notes about this trade"
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t border-stone-800">
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
                  Updating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Update
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
