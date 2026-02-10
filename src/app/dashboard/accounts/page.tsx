"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Gamepad2,
  ArrowRight,
  X,
  AlertCircle,
  Check,
  Trash,
  NotebookPen,
  AlertTriangle,
  CreditCard,
  FileSpreadsheet,
} from "lucide-react";
import axios from "axios";
import PageWrapper from "../../(components)/PageWrapper";
import Link from "next/link";
import {
  BLUE_Button,
  RED_Button,
  STONE_Button,
} from "../../../utils/CSS/Button.util";
import toast from "react-hot-toast";
import getAxiosErrorMessage from "@/utils/Variables/getAxiosError.util";
import { formatDate, formatDateTime } from "../../../utils/main.util";
import { BotAccountResponse } from "../../api/dashboard/account/route";
import CountdownTimer from "../../(components)/CountdownTimer";
import TodoModal from "../../(components)/DynamicComponent/TodoModal";
import Loader from "../../(components)/Loader";

// TODO: add in a file
interface AddAccountFormData {
  name: string;
  account_uid: string;
}

export default function ManageAccounts() {
  const [accounts, setAccounts] = useState<BotAccountResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [formData, setFormData] = useState<AddAccountFormData>({
    name: "",
    account_uid: "",
  });
  const [formErrors, setFormErrors] = useState<{
    name: string;
    account_uid: string;
  }>({
    name: "",
    account_uid: "",
  });
  const [formChecks, setFormChecks] = useState({
    nameMaxLength: false,
    nameRequired: false,
    uidValidFormat: false,
  });
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [showTodoModal, setShowTodoModal] = useState<boolean>(false);
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [selectedBotName, setSelectedBotName] = useState<string>("");

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [accountToDelete, setAccountToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/dashboard/account");

      if (response.data.success) {
        setAccounts(response.data.data || []);
      }
    } catch (err: unknown) {
      const message = getAxiosErrorMessage(err, "Error fetching accounts");
      toast.error(message);
      console.error("Error fetching accounts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const totalAccounts = accounts.length;

  const validateName = (value: string) => {
    const trimmed = value.trim();

    setFormChecks((prev) => ({
      ...prev,
      nameRequired: trimmed.length > 0,
      nameMaxLength: trimmed.length <= 30,
    }));

    if (!trimmed) {
      setFormErrors((prev) => ({ ...prev, name: "Account name is required" }));
    } else if (trimmed.length > 30) {
      setFormErrors((prev) => ({
        ...prev,
        name: "Account name must be 30 characters or less",
      }));
    } else {
      setFormErrors((prev) => ({ ...prev, name: "" }));
    }
  };

  const validateUid = (value: string) => {
    const trimmed = value.trim();

    setFormChecks((prev) => ({
      ...prev,
      uidValidFormat: trimmed.length === 0 || trimmed.length <= 36,
    }));

    if (trimmed && trimmed.length > 36) {
      setFormErrors((prev) => ({
        ...prev,
        account_uid: "Account UID must not be above 36 characters",
      }));
    } else {
      setFormErrors((prev) => ({ ...prev, account_uid: "" }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "name") {
      validateName(value);
    } else if (name === "account_uid") {
      validateUid(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    validateName(formData.name);
    validateUid(formData.account_uid);

    const trimmedName = formData.name.trim();
    const trimmedUid = formData.account_uid.trim();

    if (!trimmedName || trimmedName.length > 30) {
      toast.error("Please fix the account name errors");
      return;
    }

    if (trimmedUid && trimmedUid.length > 36) {
      toast.error("Please fix the account UID errors");
      return;
    }

    setSubmitting(true);

    try {
      const response = await axios.post("/api/dashboard/account/create", {
        name: trimmedName,
        account_uid: trimmedUid || undefined,
      });

      if (response.data.success) {
        toast.success(response.data.message || "Account created successfully!");
        resetForm();
        setShowAddModal(false);
        fetchAccounts();
      }
    } catch (err: unknown) {
      const message = getAxiosErrorMessage(err, "Error creating account");
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (botAccountId: string, botAccountName: string) => {
    setAccountToDelete({
      id: botAccountId,
      name: botAccountName,
    });
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!accountToDelete?.id) {
      toast.error("Invalid account ID");
      return;
    }

    setDeleting(true);

    try {
      const response = await axios.delete("/api/dashboard/account/delete", {
        params: { id: accountToDelete.id },
      });

      if (response.data.success) {
        toast.success("Account deleted successfully!");
        fetchAccounts();
        closeDeleteModal();
      }
    } catch (err: unknown) {
      const message = getAxiosErrorMessage(err, "Error deleting account");
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setAccountToDelete(null);
    setDeleting(false);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      account_uid: "",
    });
    setFormErrors({
      name: "",
      account_uid: "",
    });
    setFormChecks({
      nameMaxLength: false,
      nameRequired: false,
      uidValidFormat: false,
    });
  };

  const handleAddAccount = () => {
    resetForm();
    setShowAddModal(true);
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

  const isFormValid = () => {
    const trimmedName = formData.name.trim();
    const trimmedUid = formData.account_uid.trim();

    if (!trimmedName || trimmedName.length > 30) {
      return false;
    }

    if (trimmedUid && trimmedUid.length > 36) {
      return false;
    }

    return !formErrors.name && !formErrors.account_uid;
  };

  const handleTodoClick = (botId: string, botName: string) => {
    setSelectedBotId(botId);
    setSelectedBotName(botName);
    setShowTodoModal(true);
  };

  return (
    <PageWrapper withSidebar sidebarRole="user">
      <div className="min-h-screen p-4 md:p-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl md:text-3xl font-medium text-white mb-2">
              Manage Accounts
              <p className="text-stone-400 text-sm">
                View and manage all your game accounts in one place
              </p>
            </div>
            <button
              onClick={handleAddAccount}
              className={`flex text-xs items-center justify-center gap-2 p-3 ${BLUE_Button} text-white rounded cursor-pointer`}
            >
              <Plus className="h-4 w-4" />
              Add New Account
            </button>
          </div>
        </div>

        {/* Total Accounts Card */}
        <div className="mb-8">
          <div className="bg-black/30 border border-stone-800 rounded-lg p-6 hover:border-stone-700 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 rounded-lg bg-blue-600/20">
                <Gamepad2 className="text-blue-400 h-5 w-5" />
              </div>
            </div>
            <h3 className="text-2xl font-medium text-white mb-1">
              {loading ? "..." : totalAccounts.toLocaleString()}
            </h3>
            <p className="text-stone-400 text-sm">Total Accounts</p>
          </div>
        </div>

        {/* Accounts Section */}
        <div>
          {/* Loading State */}
          {loading && <Loader />}

          {/* Accounts Grid */}
          {!loading && accounts.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-stone-700 rounded-lg">
              <Gamepad2 className="h-12 w-12 text-stone-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-stone-300 mb-2">
                No accounts found
              </h3>
              <p className="text-stone-500 mb-4">
                Start by adding your first game account
              </p>
              <button
                onClick={handleAddAccount}
                className={`px-4 py-2 ${BLUE_Button} text-white rounded-lg transition-colors cursor-pointer`}
              >
                Add Your First Account
              </button>
            </div>
          ) : (
            !loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.map((account, index) => (
                  <div
                    key={index}
                    className="flex flex-col justify-between gap-4 bg-stone-950 border border-stone-900 rounded-xl p-4 hover:border-stone-800 hover:scale-101 transition-all ease-in-out duration-150"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-stone-900 border border-stone-800 text-stone-300 rounded-full font-bold w-10 h-10 flex items-center justify-center">
                          {account?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-white font-medium">
                            {account.name}
                          </h3>
                          <p className="text-stone-400 text-xs">
                            {account.account_uid || "No UID"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-stone-500">Created at</span>
                          <span className="text-stone-400">
                            {formatDateTime(account.created_at)} (
                            {formatDate(account.created_at)})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">Last Updated</span>
                          <span className="text-stone-400">
                            {formatDate(account.updated_at)}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`flex flex-wrap gap-4 ${
                          account.selected_bots.length > 0
                            ? `py-4 border-b`
                            : ``
                        } border-t border-stone-800`}
                      >
                        {account.selected_bots.map((bot) => (
                          <div
                            key={bot.name}
                            className="w-full bg-black text-stone-500 border border-stone-900 px-3 py-2 rounded-lg text-xs space-y-1"
                          >
                            <div className="font-medium text-stone-300 text-sm">
                              {bot.name}
                            </div>
                            <div className="flex justify-between">
                              <span className="text-stone-500">Wallet</span>
                              <span className="text-green-400 font-medium">
                                {bot.balance}{" "}
                                {bot.balance > 1
                                  ? `${bot.currency_name}s`
                                  : `${bot.currency_name}`}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-stone-500">
                                Crosstrade Countdown
                              </span>
                              <span className="text-stone-200 font-medium">
                                <CountdownTimer
                                  startDate={bot.last_crosstraded_at}
                                />
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-stone-500">
                                Last Crosstraded
                              </span>
                              <span className="text-stone-200 font-medium">
                                {bot.last_crosstraded_at ? (
                                  <>
                                    {formatDateTime(bot.last_crosstraded_at)} (
                                    {formatDate(bot.last_crosstraded_at)})
                                  </>
                                ) : (
                                  "--"
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-stone-500">Last Voted</span>
                              <span className="text-stone-200 font-medium">
                                {bot.voted_at ? (
                                  <>{formatDateTime(bot.voted_at)} </>
                                ) : (
                                  "--"
                                )}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4 border-stone-800">
                      <Link
                        href={`${account.id}`}
                        className={`flex-1 py-2 ${BLUE_Button} text-white rounded-lg text-sm transition-colors cursor-pointer flex items-center justify-center gap-1`}
                      >
                        <ArrowRight size={14} />
                        Manage
                      </Link>
                      <button
                        onClick={() =>
                          handleDeleteClick(account.id, account.name)
                        }
                        className={`flex-1 py-2 ${RED_Button} text-white rounded-lg text-sm transition-colors cursor-pointer flex items-center justify-center gap-1`}
                      >
                        <Trash size={14} />
                        Delete
                      </button>
                      <button
                        onClick={() =>
                          handleTodoClick(account.id, account.name)
                        }
                        className={`p-2 px-3 ${STONE_Button} text-white rounded-lg text-sm transition-colors cursor-pointer relative group`}
                      >
                        {account.todo_exists && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-md shadow-green-400/50 group-hover:opacity-0 group-hover:animate-none transition-all ease-in-out duration-150" />
                        )}
                        <NotebookPen size={14} />
                      </button>
                      <Link
                        href={`${account.id}/crosstrade/`}
                        className={`flex items-center justify-center p-2 px-3 ${STONE_Button} text-white rounded-lg text-sm transition-colors cursor-pointer relative group`}
                      >
                        <FileSpreadsheet size={14} />
                      </Link>
                      <Link
                        href={`${account.id}/wallet/`}
                        className={`flex items-center justify-center p-2 px-3 ${STONE_Button} text-white rounded-lg text-sm transition-colors cursor-pointer relative group`}
                      >
                        <CreditCard size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Add Account Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
            <div className="bg-black/90 border border-stone-800 rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-900/20 rounded-lg">
                    <Plus className="h-5 w-5 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-medium text-white">
                    Add New Account
                  </h2>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5 text-stone-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Account Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-stone-300 mb-2">
                    Account Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full p-3 bg-stone-900/50 border ${
                      formErrors.name ? "border-red-600" : "border-stone-700"
                    } rounded text-white placeholder-stone-500 focus:outline-none focus:border-blue-600`}
                    placeholder="Enter account name"
                    maxLength={30}
                  />

                  {formErrors.name && (
                    <p className="text-xs text-red-500">{formErrors.name}</p>
                  )}

                  {formData.name.trim() && (
                    <div className="mt-2 p-3 bg-stone-900/30 rounded space-y-1">
                      <p className="text-xs text-stone-400 mb-2">
                        Account name requirements:
                      </p>
                      <div className="grid grid-cols-1 gap-1">
                        <ChecklistItem
                          checked={formChecks.nameMaxLength}
                          label="Maximum 30 characters"
                          error={formData.name.trim().length > 30}
                        />
                        <ChecklistItem
                          checked={formChecks.nameRequired}
                          label="Required field"
                          error={false}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Account UID (Optional) */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-stone-300 mb-2">
                    Account UID (Optional)
                  </label>
                  <input
                    type="text"
                    name="account_uid"
                    value={formData.account_uid}
                    onChange={handleInputChange}
                    className={`w-full p-3 bg-stone-900/50 border ${
                      formErrors.account_uid
                        ? "border-red-600"
                        : "border-stone-700"
                    } rounded text-white placeholder-stone-500 focus:outline-none focus:border-blue-600`}
                    placeholder="Enter 36-character UUID (optional)"
                    maxLength={36}
                  />

                  {formErrors.account_uid && (
                    <p className="text-xs text-red-500">
                      {formErrors.account_uid}
                    </p>
                  )}

                  {formData.account_uid.trim() && (
                    <div className="mt-2 p-3 bg-stone-900/30 rounded space-y-1">
                      <p className="text-xs text-stone-400 mb-2">
                        Account UID requirements:
                      </p>
                      <div className="grid grid-cols-1 gap-1">
                        <ChecklistItem
                          checked={formChecks.uidValidFormat}
                          label="Must not exceed 36 characters"
                          error={
                            formData.account_uid.trim().length > 0 &&
                            !formChecks.uidValidFormat
                          }
                        />
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-stone-500 mt-1">
                    Leave empty if you don&apos;t have an account UID yet
                  </p>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 p-3 border border-stone-700 text-stone-300 rounded hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !isFormValid()}
                    className={`flex-1 p-3 ${
                      submitting || !isFormValid()
                        ? "bg-blue-900/50 cursor-not-allowed"
                        : `${BLUE_Button} cursor-pointer`
                    } text-white rounded font-medium flex items-center justify-center gap-2`}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Add Account
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && accountToDelete && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
            <div className="bg-black/90 border border-stone-800 rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-900/20 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <h2 className="text-xl font-medium text-white">
                    Delete Account
                  </h2>
                </div>
                <button
                  onClick={closeDeleteModal}
                  className="p-2 hover:bg-stone-900 rounded-lg transition-colors cursor-pointer"
                  disabled={deleting}
                >
                  <X className="h-5 w-5 text-stone-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-red-900/10 border border-red-800/50 rounded-lg">
                  <p className="text-red-200 text-center font-medium">
                    Are you sure you want to delete this account?
                  </p>
                </div>

                <div className="p-4 bg-stone-900/30 rounded-lg">
                  <p className="text-stone-300 text-center">
                    You are about to delete the account:
                  </p>
                  <p className="text-white text-center font-medium text-lg mt-2">
                    {accountToDelete.name}
                  </p>
                  <p className="text-stone-400 text-xs text-center mt-2">
                    This action cannot be undone. All data associated with this
                    account will be permanently removed.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    className={`flex-1 p-3 ${STONE_Button} text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteAccount}
                    disabled={deleting}
                    className={`flex-1 p-3 ${
                      deleting
                        ? "bg-red-900/50 cursor-not-allowed"
                        : `${RED_Button} cursor-pointer`
                    } text-white rounded-lg font-medium flex items-center justify-center gap-2`}
                  >
                    {deleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash className="h-4 w-4" />
                        Delete Account
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <TodoModal
        account_id={String(selectedBotId)}
        isOpen={showTodoModal}
        onClose={() => {
          setShowTodoModal(false);
          setSelectedBotId(null);
          setSelectedBotName("");
        }}
        account_name={selectedBotName}
      />
    </PageWrapper>
  );
}
