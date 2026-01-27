"use client";
import { useCallback, useEffect, useState } from "react";
import {
  X,
  Calendar,
  DollarSign,
  IndianRupee,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import getAxiosErrorMessage from "../../utils/Variables/getAxiosError.util";
import { CrossTradeRequestAPI } from "../api/dashboard/account/[account_id]/crosstrade/route";
import { BLUE_Button, STONE_Button } from "../../utils/CSS/Button.util";

// TODO: put in the file
interface BotAssociated {
  id: string;
  name: string;
}

interface CrossTrade {
  id: string;
  crosstrade_date: string;
  currency: "inr" | "usd";
  crosstrade_via: "upi" | "paypal" | "wise";
  amount_received: number;
  rate: string;
  conversion_rate: number;
  net_amount: number;
  traded_with: string;
  trade_link: string;
  traded: boolean;
  paid: boolean;
  note: string;
  bot_name?: string;
}

interface CrossTradeFormProps {
  accountId: string;
  onClose: () => void;
  onSuccess?: () => void;
  bot_associated?: BotAssociated[];
  isEditing?: boolean;
  tradeToEdit?: CrossTrade | null;
}

interface CrossTradeFormData {
  crosstrade_date: string;
  currency: "inr" | "usd";
  crosstrade_via: "upi" | "paypal" | "wise";
  amount_received: number;
  rate: string;
  conversion_rate: number;
  net_amount: number;
  traded_with: string;
  trade_link: string;
  traded: boolean;
  paid: boolean;
  note: string;
  selected_bot_id?: string;
}

const getLocalDateTimeString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function CrossTradeForm({
  accountId,
  onClose,
  onSuccess,
  bot_associated = [],
  isEditing = false,
  tradeToEdit = null,
}: CrossTradeFormProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [amountChecks, setAmountChecks] = useState({
    required: false,
    positive: false,
  });

  const [netAmountChecks, setNetAmountChecks] = useState({
    required: false,
    positive: false,
  });

  const [rateChecks, setRateChecks] = useState({
    required: false,
  });

  const [conversionRateChecks, setConversionRateChecks] = useState({
    required: false,
    positive: false,
  });

  const [traderChecks, setTraderChecks] = useState({
    required: false,
  });

  const [tradeLinkChecks, setTradeLinkChecks] = useState({
    required: false,
    validFormat: false,
  });

  const getInitialFormData = (): CrossTradeFormData => {
    if (isEditing && tradeToEdit) {
      const editDate = new Date(tradeToEdit.crosstrade_date);
      const localDate = editDate.toISOString().slice(0, 16);
      let selectedBotId = "";
      if (tradeToEdit.bot_name && bot_associated.length > 0) {
        const foundBot = bot_associated.find(
          (bot) => bot.name === tradeToEdit.bot_name
        );
        selectedBotId = foundBot ? foundBot.id : "";
      }

      if (!selectedBotId && bot_associated.length > 0) {
        selectedBotId = bot_associated[0].id;
      }

      return {
        crosstrade_date: localDate,
        currency: tradeToEdit.currency,
        crosstrade_via: tradeToEdit.crosstrade_via,
        amount_received: tradeToEdit.amount_received,
        rate: tradeToEdit.rate || "",
        conversion_rate: tradeToEdit.conversion_rate || 0,
        net_amount: tradeToEdit.net_amount,
        traded_with: tradeToEdit.traded_with || "",
        trade_link: tradeToEdit.trade_link || "",
        traded: tradeToEdit.traded,
        paid: tradeToEdit.paid,
        note: tradeToEdit.note || "",
        selected_bot_id: selectedBotId,
      };
    }

    return {
      crosstrade_date: getLocalDateTimeString(),
      currency: "inr",
      crosstrade_via: "upi",
      amount_received: 0,
      rate: "",
      conversion_rate: 0,
      net_amount: 0,
      traded_with: "",
      trade_link: "",
      traded: true,
      paid: true,
      note: "",
      selected_bot_id: bot_associated.length > 0 ? bot_associated[0].id : "",
    };
  };

  const [formData, setFormData] = useState<CrossTradeFormData>(
    getInitialFormData()
  );

  const validateAmountReceived = (value: number) => {
    setAmountChecks({
      required: value > 0,
      positive: value > 0,
    });

    if (!value || value <= 0) {
      setErrors((prev) => ({
        ...prev,
        amount_received: "Amount received must be greater than 0",
      }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.amount_received;
        return newErrors;
      });
    }
  };

  const validateNetAmount = (value: number) => {
    setNetAmountChecks({
      required: value > 0,
      positive: value > 0,
    });

    if (!value || value <= 0) {
      setErrors((prev) => ({
        ...prev,
        net_amount: "Net amount must be greater than 0",
      }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.net_amount;
        return newErrors;
      });
    }
  };

  const validateRate = (value: string) => {
    setRateChecks({
      required: value.trim().length > 0,
    });

    if (!value.trim()) {
      setErrors((prev) => ({ ...prev, rate: "Rate is required" }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.rate;
        return newErrors;
      });
    }
  };

  const validateConversionRate = useCallback(
    (value: number) => {
      setConversionRateChecks({
        required: formData.currency === "usd" && value > 0,
        positive: value > 0,
      });

      if (formData.currency === "usd" && (!value || value <= 0)) {
        setErrors((prev) => ({
          ...prev,
          conversion_rate: "Conversion rate must be greater than 0 for USD",
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.conversion_rate;
          return newErrors;
        });
      }
    },
    [formData.currency]
  );

  useEffect(() => {
    validateAmountReceived(formData.amount_received);
    validateNetAmount(formData.net_amount);
    validateRate(formData.rate);
    if (formData.currency === "usd") {
      validateConversionRate(formData.conversion_rate);
    }
  }, [
    formData.amount_received,
    formData.conversion_rate,
    formData.currency,
    formData.net_amount,
    formData.rate,
    validateConversionRate,
  ]);

  const validateTrader = (value: string) => {
    setTraderChecks({
      required: value.trim().length > 0,
    });
  };

  const validateTradeLink = (value: string) => {
    const trimmed = value.trim();
    const isValidUrl = (url: string) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    setTradeLinkChecks({
      required: trimmed.length > 0,
      validFormat: trimmed.length > 0 && isValidUrl(trimmed),
    });

    if (trimmed && !isValidUrl(trimmed)) {
      setErrors((prev) => ({
        ...prev,
        trade_link: "Please enter a valid URL",
      }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.trade_link;
        return newErrors;
      });
    }
  };

  const handleCurrencyChange = (currency: "inr" | "usd") => {
    const defaultPaymentMethod = currency === "inr" ? "upi" : "paypal";

    setFormData({
      crosstrade_date: getLocalDateTimeString(),
      currency,
      crosstrade_via: defaultPaymentMethod,
      amount_received: 0,
      rate: "",
      conversion_rate: 0,
      net_amount: 0,
      traded_with: "",
      trade_link: "",
      traded: true,
      paid: true,
      note: "",
      selected_bot_id:
        formData.selected_bot_id ||
        (bot_associated.length > 0 ? bot_associated[0].id : ""),
    });

    setAmountChecks({ required: false, positive: false });
    setNetAmountChecks({ required: false, positive: false });
    setRateChecks({ required: false });
    setConversionRateChecks({ required: false, positive: false });
    setTraderChecks({ required: false });
    setTradeLinkChecks({ required: false, validFormat: false });
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.traded_with;
      delete newErrors.trade_link;
      return newErrors;
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
      setFormData((prev) => ({
        ...prev,
        [name]: checkbox.checked,
      }));
    } else if (type === "number") {
      const numValue = Number(value);
      setFormData((prev) => ({
        ...prev,
        [name]: numValue,
      }));

      if (name === "amount_received") validateAmountReceived(numValue);
      if (name === "net_amount") validateNetAmount(numValue);
      if (name === "conversion_rate") validateConversionRate(numValue);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      if (name === "rate") validateRate(value);
      if (name === "traded_with") validateTrader(value);
      if (name === "trade_link") validateTradeLink(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      bot_associated &&
      bot_associated.length > 0 &&
      !formData.selected_bot_id
    ) {
      toast.error("Please select a bot");
      return;
    }

    validateAmountReceived(formData.amount_received);
    validateNetAmount(formData.net_amount);
    validateRate(formData.rate);
    if (formData.currency === "usd")
      validateConversionRate(formData.conversion_rate);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the errors in the form");
      return;
    }

    if (
      !amountChecks.positive ||
      !netAmountChecks.positive ||
      !rateChecks.required
    ) {
      toast.error("Please complete all required fields");
      return;
    }

    if (formData.currency === "usd" && !conversionRateChecks.positive) {
      toast.error("Conversion rate is required for USD");
      return;
    }

    setLoading(true);

    try {
      const localDate = new Date(formData.crosstrade_date);
      if (isNaN(localDate.getTime())) {
        toast.error("Invalid date selected");
        return;
      }
      const isoDate = localDate.toISOString();

      const requestData: CrossTradeRequestAPI = {
        crosstrade_date: isoDate,
        currency: formData.currency,
        crosstrade_via: formData.crosstrade_via,
        amount_received: formData.amount_received,
        rate: formData.rate || null,
        conversion_rate:
          formData.currency === "usd" ? formData.conversion_rate : null,
        net_amount: formData.net_amount,
        traded_with: formData.traded_with.trim(),
        trade_link: formData.trade_link.trim(),
        traded: formData.traded,
        paid: formData.paid,
        note: formData.note.trim() || null,
      };

      if (formData.selected_bot_id) {
        requestData.bot_id = formData.selected_bot_id;
        requestData.bot_account_id = accountId;
      }

      let response;
      if (isEditing && tradeToEdit) {
        response = await axios.put(
          `/api/dashboard/account/${accountId}/crosstrade/${tradeToEdit.id}`,
          requestData
        );
      } else {
        response = await axios.post(
          `/api/dashboard/account/${accountId}/crosstrade`,
          requestData
        );
      }

      if (response.data.success) {
        toast.success(
          isEditing
            ? "Cross trade updated successfully!"
            : "Cross trade created successfully!"
        );
        onSuccess?.();
        onClose();
      }
    } catch (error: unknown) {
      toast.error(
        getAxiosErrorMessage(
          error,
          isEditing
            ? "Error updating cross trade"
            : "Error creating cross trade"
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const ChecklistItem = ({
    checked,
    label,
    error = false,
  }: {
    checked: boolean;
    label: string;
    error?: boolean;
  }) => (
    <div className="flex items-center gap-2 text-xs">
      {checked ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : error ? (
        <AlertCircle className="h-3 w-3 text-yellow-500" />
      ) : (
        <X className="h-3 w-3 text-stone-500" />
      )}
      <span
        className={
          checked
            ? "text-green-400"
            : error
            ? "text-yellow-400"
            : "text-stone-400"
        }
      >
        {label}
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-black/90 border border-stone-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header - Show different title for edit */}
        <div className="flex items-center justify-between p-6 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-medium text-white">
              {isEditing ? "Edit Crosstrade" : "New Crosstrade"}
            </h2>
            {isEditing && (
              <span className="px-2 py-1 bg-blue-900/30 text-blue-400 text-xs rounded border border-blue-800">
                Editing: #{tradeToEdit?.id}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5 text-stone-400" />
          </button>
        </div>

        {/* Form remains mostly the same */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Currency Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-300 mb-2">
              Currency <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleCurrencyChange("inr")}
                className={`flex-1 p-3 border rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  formData.currency === "inr"
                    ? "border-blue-600 bg-blue-900/20"
                    : "border-stone-700 hover:border-stone-600"
                }`}
              >
                <IndianRupee
                  className={`h-4 w-4 ${
                    formData.currency === "inr"
                      ? "text-blue-400"
                      : "text-stone-500"
                  }`}
                />
                <span
                  className={`font-medium ${
                    formData.currency === "inr"
                      ? "text-blue-400"
                      : "text-stone-300"
                  }`}
                >
                  INR
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleCurrencyChange("usd")}
                className={`flex-1 p-3 border rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  formData.currency === "usd"
                    ? "border-blue-600 bg-blue-900/20"
                    : "border-stone-700 hover:border-stone-600"
                }`}
              >
                <DollarSign
                  className={`h-4 w-4 ${
                    formData.currency === "usd"
                      ? "text-blue-400"
                      : "text-stone-500"
                  }`}
                />
                <span
                  className={`font-medium ${
                    formData.currency === "usd"
                      ? "text-blue-400"
                      : "text-stone-300"
                  }`}
                >
                  USD
                </span>
              </button>
            </div>
          </div>

          {/* Bot Selection */}
          {bot_associated && bot_associated.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-300 mb-2">
                Select Bot <span className="text-red-400">*</span>
              </label>
              <select
                name="selected_bot_id"
                value={formData.selected_bot_id || ""}
                onChange={handleInputChange}
                className="w-full p-2.5 bg-stone-900/50 border border-stone-700 rounded-lg text-white focus:outline-none focus:border-blue-600 cursor-pointer"
                required
              >
                <option value="" disabled>
                  Select a bot
                </option>
                {bot_associated.map((bot) => (
                  <option key={bot.id} value={bot.id}>
                    {bot.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Crosstrade Date */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-300 mb-2">
              Crosstrade Date <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-500" />
              <input
                type="datetime-local"
                name="crosstrade_date"
                value={formData.crosstrade_date}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2.5 bg-stone-900/50 border border-stone-700 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:border-blue-600 cursor-pointer"
                required
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-300 mb-2">
              Payment Method <span className="text-red-400">*</span>
            </label>
            <select
              name="crosstrade_via"
              value={formData.crosstrade_via}
              onChange={handleInputChange}
              className="w-full p-2.5 bg-stone-900/50 border border-stone-700 rounded-lg text-white focus:outline-none focus:border-blue-600 cursor-pointer"
              required
            >
              {formData.currency === "inr" ? (
                <>
                  <option value="upi">UPI</option>
                  <option value="wise">Wise</option>
                </>
              ) : (
                <option value="paypal">PayPal</option>
              )}
            </select>
          </div>

          {/* Amount Received */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-300 mb-2">
              Amount Received <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              {formData.currency === "inr" ? (
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-500" />
              ) : (
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-500" />
              )}
              <input
                type="number"
                name="amount_received"
                value={formData.amount_received || ""}
                onChange={handleInputChange}
                min="1"
                step="0.01"
                className={`w-full pl-10 pr-4 py-2.5 bg-stone-900/50 border ${
                  errors.amount_received ? "border-red-600" : "border-stone-700"
                } rounded-lg text-white placeholder-stone-500 focus:outline-none focus:border-blue-600 cursor-text`}
                placeholder="Enter amount received"
              />
            </div>

            {errors.amount_received && (
              <p className="text-xs text-red-500">{errors.amount_received}</p>
            )}

            {formData.amount_received > 0 && (
              <div className="mt-2 p-3 bg-stone-900/30 rounded-lg space-y-1">
                <p className="text-xs text-stone-400 mb-2">
                  Amount received requirements:
                </p>
                <div className="grid grid-cols-1 gap-1">
                  <ChecklistItem
                    checked={amountChecks.required}
                    label="Required field"
                  />
                  <ChecklistItem
                    checked={amountChecks.positive}
                    label="Must be greater than 0"
                    error={formData.amount_received <= 0}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Rate */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-300 mb-2">
              Rate <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="rate"
              value={formData.rate}
              onChange={handleInputChange}
              className={`w-full p-2.5 bg-stone-900/50 border ${
                errors.rate ? "border-red-600" : "border-stone-700"
              } rounded-lg text-white placeholder-stone-500 focus:outline-none focus:border-blue-600 cursor-text`}
              placeholder="30:1$ (Write 'N/A' if not applicable)"
            />

            {errors.rate && (
              <p className="text-xs text-red-500">{errors.rate}</p>
            )}

            {formData.rate.trim() && (
              <div className="mt-2 p-3 bg-stone-900/30 rounded-lg space-y-1">
                <p className="text-xs text-stone-400 mb-2">
                  Rate requirements:
                </p>
                <div className="grid grid-cols-1 gap-1">
                  <ChecklistItem
                    checked={rateChecks.required}
                    label="Required field"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Conversion Rate (Only for USD) */}
          {formData.currency === "usd" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-300 mb-2">
                Conversion Rate <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                name="conversion_rate"
                value={formData.conversion_rate || ""}
                onChange={handleInputChange}
                min="0"
                step="0.00000000000001"
                className={`w-full p-2.5 bg-stone-900/50 border ${
                  errors.conversion_rate ? "border-red-600" : "border-stone-700"
                } rounded-lg text-white placeholder-stone-500 focus:outline-none focus:border-blue-600 cursor-text`}
                placeholder="82.456789"
              />

              {errors.conversion_rate && (
                <p className="text-xs text-red-500">{errors.conversion_rate}</p>
              )}

              {formData.conversion_rate > 0 && (
                <div className="mt-2 p-3 bg-stone-900/30 rounded-lg space-y-1">
                  <p className="text-xs text-stone-400 mb-2">
                    Conversion rate requirements:
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    <ChecklistItem
                      checked={conversionRateChecks.required}
                      label="Required field"
                    />
                    <ChecklistItem
                      checked={conversionRateChecks.positive}
                      label="Must be greater than 0"
                      error={formData.conversion_rate <= 0}
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-stone-500">
                Enter conversion rate (up to 12 decimal places)
              </p>
            </div>
          )}

          {/* Net Amount */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-300 mb-2">
              Net Amount <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              {formData.currency === "inr" ? (
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-500" />
              ) : (
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-500" />
              )}
              <input
                type="number"
                name="net_amount"
                value={formData.net_amount || ""}
                onChange={handleInputChange}
                min="1"
                step="0.01"
                className={`w-full pl-10 pr-4 py-2.5 bg-stone-900/50 border ${
                  errors.net_amount ? "border-red-600" : "border-stone-700"
                } rounded-lg text-white placeholder-stone-500 focus:outline-none focus:border-blue-600 cursor-text`}
                placeholder="Amount you received after any deduction"
              />
            </div>

            {errors.net_amount && (
              <p className="text-xs text-red-500">{errors.net_amount}</p>
            )}

            {formData.net_amount > 0 && (
              <div className="mt-2 p-3 bg-stone-900/30 rounded-lg space-y-1">
                <p className="text-xs text-stone-400 mb-2">
                  Net amount requirements:
                </p>
                <div className="grid grid-cols-1 gap-1">
                  <ChecklistItem
                    checked={netAmountChecks.required}
                    label="Required field"
                  />
                  <ChecklistItem
                    checked={netAmountChecks.positive}
                    label="Must be greater than 0"
                    error={formData.net_amount <= 0}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Buyer ID */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-300 mb-2">
              Buyer ID
            </label>
            <input
              type="text"
              name="traded_with"
              value={formData.traded_with}
              onChange={handleInputChange}
              className={`w-full p-2.5 bg-stone-900/50 border ${
                errors.traded_with ? "border-red-600" : "border-stone-700"
              } rounded-lg text-white placeholder-stone-500 focus:outline-none focus:border-blue-600 cursor-text`}
              placeholder="User ID of the buyer (optional)"
            />

            {errors.traded_with && (
              <p className="text-xs text-red-500">{errors.traded_with}</p>
            )}

            {formData.traded_with.trim() && (
              <div className="mt-2 p-3 bg-stone-900/30 rounded-lg space-y-1">
                <p className="text-xs text-stone-400 mb-2">
                  Trader ID requirements:
                </p>
                <div className="grid grid-cols-1 gap-1">
                  <ChecklistItem
                    checked={traderChecks.required}
                    label="Field is optional"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Trade Link */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-300 mb-2">
              Trade Link
            </label>
            <input
              type="url"
              name="trade_link"
              value={formData.trade_link}
              onChange={handleInputChange}
              className={`w-full p-2.5 bg-stone-900/50 border ${
                errors.trade_link ? "border-red-600" : "border-stone-700"
              } rounded-lg text-white placeholder-stone-500 focus:outline-none focus:border-blue-600 cursor-text`}
              placeholder="Trade link (optional)"
            />

            {errors.trade_link && (
              <p className="text-xs text-red-500">{errors.trade_link}</p>
            )}

            {formData.trade_link.trim() && (
              <div className="mt-2 p-3 bg-stone-900/30 rounded-lg space-y-1">
                <p className="text-xs text-stone-400 mb-2">
                  Trade link requirements:
                </p>
                <div className="grid grid-cols-1 gap-1">
                  <ChecklistItem
                    checked={tradeLinkChecks.required}
                    label="Field is optional"
                  />
                  <ChecklistItem
                    checked={tradeLinkChecks.validFormat}
                    label="Valid URL format"
                    error={
                      formData.trade_link.trim().length > 0 &&
                      !tradeLinkChecks.validFormat
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Toggle Options */}
          <div className="grid grid-cols-2 gap-4">
            {/* Traded Toggle */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-300 mb-2">
                Traded
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, traded: true }))
                  }
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    formData.traded
                      ? "bg-green-900/30 border border-green-800 text-green-400"
                      : "bg-stone-900/50 border border-stone-700 text-stone-400 hover:border-stone-600"
                  }`}
                >
                  <Check className="h-4 w-4" />
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, traded: false }))
                  }
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    !formData.traded
                      ? "bg-red-900/30 border border-red-800 text-red-400"
                      : "bg-stone-900/50 border border-stone-700 text-stone-400 hover:border-stone-600"
                  }`}
                >
                  <X className="h-4 w-4" />
                  No
                </button>
              </div>
            </div>

            {/* Paid Toggle */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-300 mb-2">
                Paid
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, paid: true }))
                  }
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    formData.paid
                      ? "bg-green-900/30 border border-green-800 text-green-400"
                      : "bg-stone-900/50 border border-stone-700 text-stone-400 hover:border-stone-600"
                  }`}
                >
                  <Check className="h-4 w-4" />
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, paid: false }))
                  }
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    !formData.paid
                      ? "bg-red-900/30 border border-red-800 text-red-400"
                      : "bg-stone-900/50 border border-stone-700 text-stone-400 hover:border-stone-600"
                  }`}
                >
                  <X className="h-4 w-4" />
                  No
                </button>
              </div>
            </div>
          </div>

          {/* Note (Optional) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-300 mb-2">
              Note (Optional)
            </label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-2.5 bg-stone-900/50 border border-stone-700 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:border-blue-600 resize-none"
              placeholder="Additional notes about this trade"
            />
          </div>

          {/* Update submit button text */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 p-3 ${STONE_Button} text-stone-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || Object.keys(errors).length > 0}
              className={`flex-1 p-3 ${
                loading || Object.keys(errors).length > 0
                  ? "bg-blue-900/50 cursor-not-allowed"
                  : ` ${BLUE_Button} cursor-pointer`
              } text-white rounded-lg font-medium flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditing ? "Updating..." : "Processing..."}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {isEditing ? "Update" : "Submit"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
