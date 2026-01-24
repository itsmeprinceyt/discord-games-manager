"use client";
import { useState } from "react";
import { Bot, Save, X, AlertCircle, Check } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import PageWrapper from "../../(components)/PageWrapper";
import getAxiosErrorMessage from "@/utils/Variables/getAxiosError.util";
import { BLUE_Button } from "../../../utils/CSS/Button.util";
import { BotFormData } from "../../../types/Admin/BotManager/BotManager.type";

export default function AddBotForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [nameError, setNameError] = useState<string>("");
  const [currencyError, setCurrencyError] = useState<string>("");
  const [voteLinkError, setVoteLinkError] = useState<string>("");
  const [normalDaysError, setNormalDaysError] = useState<string>("");
  const [weekendDaysError, setWeekendDaysError] = useState<string>("");

  const [nameChecks, setNameChecks] = useState({
    maxLength: false,
    required: false,
  });

  const [currencyChecks, setCurrencyChecks] = useState({
    maxLength: false,
    required: false,
  });

  const [voteLinkChecks, setVoteLinkChecks] = useState({
    required: false,
    validFormat: false,
  });

  const [formData, setFormData] = useState<BotFormData>({
    name: "",
    currency_name: "",
    vote_link: "",
    normal_days: 1,
    weekend_days: 2,
  });

  const validateName = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setNameError("");
      setNameChecks({
        maxLength: false,
        required: false,
      });
      return;
    }

    setNameChecks({
      maxLength: trimmed.length <= 30,
      required: trimmed.length > 0,
    });

    if (trimmed.length > 30) {
      setNameError("Bot name must be less than 30 characters");
    } else {
      setNameError("");
    }
  };

  const validateCurrency = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setCurrencyError("");
      setCurrencyChecks({
        maxLength: false,
        required: false,
      });
      return;
    }

    setCurrencyChecks({
      maxLength: trimmed.length <= 30,
      required: trimmed.length > 0,
    });

    if (trimmed.length > 30) {
      setCurrencyError("Currency name must be less than 30 characters");
    } else {
      setCurrencyError("");
    }
  };

  const validateVoteLink = (value: string) => {
    const trimmed = value.trim();
    const isRequired = trimmed.length > 0;
    let isValidFormat: boolean = false;

    if (trimmed) {
      try {
        new URL(trimmed);
        isValidFormat = true;
      } catch {
        isValidFormat = false;
      }
    }

    setVoteLinkChecks({
      required: isRequired,
      validFormat: isValidFormat,
    });

    if (!trimmed) {
      setVoteLinkError("Vote link is required");
      return;
    }

    if (!isValidFormat) {
      setVoteLinkError("Please enter a valid URL");
    } else {
      setVoteLinkError("");
    }
  };

  const validateNormalDays = (value: number) => {
    if (value < 1 || value > 30) {
      setNormalDaysError("Normal days must be between 1 and 30");
    } else {
      setNormalDaysError("");
    }
  };

  const validateWeekendDays = (value: number) => {
    if (value < 0 || value > 7) {
      setWeekendDaysError("Weekend days must be between 0 and 7");
    } else {
      setWeekendDaysError("");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "number") {
      const numValue = Number(value);
      setFormData((prev) => ({
        ...prev,
        [name]: numValue,
      }));

      if (name === "normal_days") {
        validateNormalDays(numValue);
      } else if (name === "weekend_days") {
        validateWeekendDays(numValue);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      if (name === "name") {
        validateName(value);
      } else if (name === "currency_name") {
        validateCurrency(value);
      } else if (name === "vote_link") {
        validateVoteLink(value);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedName = formData.name.trim();
    const trimmedCurrency = formData.currency_name.trim();
    const trimmedVoteLink = formData.vote_link.trim();

    if (!trimmedName || !trimmedCurrency || !trimmedVoteLink) {
      setError("Bot name, currency name, and vote link are required");
      return;
    }

    if (trimmedName.length > 30) {
      setError("Bot name must be less than 30 characters");
      return;
    }

    if (trimmedCurrency.length > 30) {
      setError("Currency name must be less than 30 characters");
      return;
    }

    if (!isValidUrl(trimmedVoteLink)) {
      setError("Please enter a valid URL for vote link");
      return;
    }

    if (trimmedVoteLink.length > 100) {
      setError("Vote link must be less than 100 characters");
      return;
    }

    if (formData.normal_days < 1 || formData.normal_days > 30) {
      setError("Normal days must be between 1 and 30");
      return;
    }

    if (formData.weekend_days < 0 || formData.weekend_days > 7) {
      setError("Weekend days must be between 0 and 7");
      return;
    }

    if (
      nameError ||
      currencyError ||
      voteLinkError ||
      normalDaysError ||
      weekendDaysError
    ) {
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("/api/admin/bot-manager", {
        name: trimmedName,
        currency_name: trimmedCurrency,
        vote_link: trimmedVoteLink,
        normal_days: formData.normal_days,
        weekend_days: formData.weekend_days,
      });

      if (response.data.success) {
        toast.success(response.data.message || "Bot created successfully!");
        resetForm();
      }
    } catch (err: unknown) {
      const errorMessage = getAxiosErrorMessage(err, "Error creating bot");
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      currency_name: "",
      vote_link: "",
      normal_days: 1,
      weekend_days: 2,
    });
    setNameError("");
    setCurrencyError("");
    setVoteLinkError("");
    setNormalDaysError("");
    setWeekendDaysError("");
    setError("");
    setNameChecks({
      maxLength: false,
      required: false,
    });
    setCurrencyChecks({
      maxLength: false,
      required: false,
    });
    setVoteLinkChecks({
      required: false,
      validFormat: false,
    });
  };

  const handleReset = () => {
    resetForm();
  };

  const isFormValid = () => {
    const trimmedName = formData.name.trim();
    const trimmedCurrency = formData.currency_name.trim();
    const trimmedVoteLink = formData.vote_link.trim();

    if (!trimmedName || !trimmedCurrency || !trimmedVoteLink) {
      return false;
    }

    if (
      nameError ||
      currencyError ||
      voteLinkError ||
      normalDaysError ||
      weekendDaysError
    ) {
      return false;
    }

    if (
      !Object.values(nameChecks).every(Boolean) ||
      !Object.values(currencyChecks).every(Boolean) ||
      !voteLinkChecks.required ||
      !voteLinkChecks.validFormat
    ) {
      return false;
    }

    return true;
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
    <PageWrapper withSidebar sidebarRole="admin">
      <div className="min-h-screen flex items-start justify-center p-4">
        <div className="max-w-md w-full p-8 bg-black/30 border border-stone-800 rounded-lg">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-2 bg-blue-900/20 rounded-lg">
                <Bot className="h-6 w-6 text-blue-400" />
              </div>
              <h2 className="text-2xl font-medium text-white">Add New Bot</h2>
            </div>
            <p className="text-stone-400 text-sm">
              Configure a new bot with custom settings and currency system
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Bot Name Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-300 mb-2">
                Bot Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full p-3 bg-stone-900/50 border ${
                  nameError ? "border-red-600" : "border-stone-700"
                } rounded text-white placeholder-stone-500 focus:outline-none focus:border-blue-600`}
                placeholder="Enter bot name"
                maxLength={30}
              />

              {/* Bot Name Error */}
              {nameError && <p className="text-xs text-red-500">{nameError}</p>}

              {/* Bot Name Requirements Checklist */}
              {formData.name.trim() && (
                <div className="mt-2 p-3 bg-stone-900/30 rounded space-y-1">
                  <p className="text-xs text-stone-400 mb-2">
                    Bot name requirements:
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    <ChecklistItem
                      checked={nameChecks.maxLength}
                      label="Maximum 30 characters"
                      error={formData.name.trim().length > 30}
                    />
                    <ChecklistItem
                      checked={nameChecks.required}
                      label="Required field"
                      error={false}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Currency Name Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-300 mb-2">
                Currency Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="currency_name"
                value={formData.currency_name}
                onChange={handleChange}
                className={`w-full p-3 bg-stone-900/50 border ${
                  currencyError ? "border-red-600" : "border-stone-700"
                } rounded text-white placeholder-stone-500 focus:outline-none focus:border-blue-600`}
                placeholder="Coins, Tokens, Points"
                maxLength={30}
              />

              {/* Currency Name Error */}
              {currencyError && (
                <p className="text-xs text-red-500">{currencyError}</p>
              )}

              {/* Currency Name Requirements Checklist */}
              {formData.currency_name.trim() && (
                <div className="mt-2 p-3 bg-stone-900/30 rounded space-y-1">
                  <p className="text-xs text-stone-400 mb-2">
                    Currency name requirements:
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    <ChecklistItem
                      checked={currencyChecks.maxLength}
                      label="Maximum 30 characters"
                      error={formData.currency_name.trim().length > 30}
                    />
                    <ChecklistItem
                      checked={currencyChecks.required}
                      label="Required field"
                      error={false}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Vote Link Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-300 mb-2">
                Vote Link <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                name="vote_link"
                value={formData.vote_link}
                onChange={handleChange}
                className={`w-full p-3 bg-stone-900/50 border ${
                  voteLinkError ? "border-red-600" : "border-stone-700"
                } rounded text-white placeholder-stone-500 focus:outline-none focus:border-blue-600`}
                placeholder="Link where you vote for this bot"
              />

              {/* Vote Link Error */}
              {voteLinkError && (
                <p className="text-xs text-red-500">{voteLinkError}</p>
              )}

              {/* Vote Link Requirements Checklist */}
              {formData.vote_link.trim() && (
                <div className="mt-2 p-3 bg-stone-900/30 rounded space-y-1">
                  <p className="text-xs text-stone-400 mb-2">
                    Vote link requirements:
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    <ChecklistItem
                      checked={voteLinkChecks.required}
                      label="Required field"
                      error={false}
                    />
                    <ChecklistItem
                      checked={voteLinkChecks.validFormat}
                      label="Valid URL format"
                      error={
                        formData.vote_link.trim().length > 0 &&
                        !voteLinkChecks.validFormat
                      }
                    />
                  </div>
                </div>
              )}
              <p className="mt-1 text-xs text-stone-500">
                URL where users can vote for the bot
              </p>
            </div>

            {/* Days Configuration */}
            <div className="grid grid-cols-2 gap-4">
              {/* Normal Days */}
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">
                  Normal Days <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="normal_days"
                  value={formData.normal_days}
                  onChange={handleChange}
                  min="1"
                  className={`w-full p-3 bg-stone-900/50 border ${
                    normalDaysError ? "border-red-600" : "border-stone-700"
                  } rounded text-white focus:outline-none focus:border-blue-600`}
                />
                {normalDaysError && (
                  <p className="mt-1 text-xs text-red-500">{normalDaysError}</p>
                )}
              </div>

              {/* Weekend Days */}
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">
                  Weekend Days <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="weekend_days"
                  value={formData.weekend_days}
                  onChange={handleChange}
                  min="1"
                  className={`w-full p-3 bg-stone-900/50 border ${
                    weekendDaysError ? "border-red-600" : "border-stone-700"
                  } rounded text-white focus:outline-none focus:border-blue-600`}
                />
                {weekendDaysError && (
                  <p className="mt-1 text-xs text-red-500">
                    {weekendDaysError}
                  </p>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-800 text-red-400 rounded text-sm">
                {error}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 p-3 border border-stone-700 text-stone-300 rounded hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={loading}
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={loading || !isFormValid()}
                className={`flex-1 p-3 ${
                  loading || !isFormValid()
                    ? "bg-blue-900/50 cursor-not-allowed"
                    : `${BLUE_Button} cursor-pointer`
                } text-white rounded font-medium flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Add Bot
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
}
