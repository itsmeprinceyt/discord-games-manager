"use client";
import React, { useState, useEffect } from "react";
import {
  X,
  CoinsIcon,
  RefreshCw,
  CheckSquare,
  Square,
  Loader2,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import getAxiosErrorMessage from "../../utils/Variables/getAxiosError.util";
import { STONE_Button } from "../../utils/CSS/Button.util";

// TODO: put in file
interface Account {
  id: string;
  name: string;
}

interface CustomVoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CustomVoteModal({
  isOpen,
  onClose,
  onSuccess,
}: CustomVoteModalProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingAccounts, setLoadingAccounts] = useState<boolean>(false);
  const [voting, setVoting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const response = await axios.get(
        `/api/dashboard/account/placeholder/currency-crosstrade/accounts`
      );
      if (response.data.success) {
        const data: Account[] = response.data.data;
        setAccounts(data);
        setSelectedIds(new Set(data.map((a) => a.id)));
      }
    } catch (err: unknown) {
      toast.error(getAxiosErrorMessage(err, "Error fetching accounts"));
    } finally {
      setLoadingAccounts(false);
    }
  };

  const toggleAccount = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === accounts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(accounts.map((a) => a.id)));
    }
  };

  const handleVote = async () => {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one account");
      return;
    }

    try {
      setVoting(true);
      const response = await axios.post("/api/dashboard/custom-vote", {
        account_ids: Array.from(selectedIds),
      });

      if (response.data.success) {
        toast.success(response.data.message);
        onSuccess();
        onClose();
      }
    } catch (err: unknown) {
      toast.error(getAxiosErrorMessage(err, "Error during custom vote"));
    } finally {
      setVoting(false);
    }
  };

  if (!isOpen) return null;

  const allSelected =
    selectedIds.size === accounts.length && accounts.length > 0;
  const someSelected =
    selectedIds.size > 0 && selectedIds.size < accounts.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-stone-950 border border-stone-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-600/20">
              <CoinsIcon className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-white font-medium text-base">Custom Vote</h2>
              <p className="text-stone-500 text-xs mt-0.5">
                Select accounts to vote for
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {loadingAccounts ? (
            <div className="flex items-center justify-center py-10 gap-3 text-stone-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading accounts...</span>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-10 text-stone-500 text-sm">
              No accounts found
            </div>
          ) : (
            <>
              {/* Select All Toggle */}
              <button
                onClick={toggleAll}
                className="flex items-center gap-2 text-sm text-stone-400 hover:text-white transition-colors mb-3 w-full cursor-pointer"
              >
                <span
                  className={`transition-colors ${
                    allSelected
                      ? "text-purple-400"
                      : someSelected
                      ? "text-purple-400/60"
                      : "text-stone-600"
                  }`}
                >
                  {allSelected ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </span>
                <span>{allSelected ? "Deselect All" : "Select All"}</span>
                <span className="ml-auto text-stone-600 text-xs">
                  {selectedIds.size}/{accounts.length} selected
                </span>
              </button>

              {/* Account List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-transparent">
                {accounts.map((account) => {
                  const isSelected = selectedIds.has(account.id);
                  return (
                    <button
                      key={account.id}
                      onClick={() => toggleAccount(account.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-purple-700/60 bg-purple-900/15 text-white"
                          : "border-stone-800 bg-stone-900/30 text-stone-400 hover:border-stone-700"
                      }`}
                    >
                      <span
                        className={`transition-colors shrink-0 ${
                          isSelected ? "text-purple-400" : "text-stone-600"
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{account.name}</p>
                        <p className="text-xs text-stone-600 truncate">
                          ID: {account.id}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-stone-800">
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2.5 rounded-lg ${STONE_Button} text-stone-400 hover:text-white text-sm transition-colors cursor-pointer`}
          >
            Cancel
          </button>
          <button
            onClick={handleVote}
            disabled={voting || selectedIds.size === 0 || loadingAccounts}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              voting || selectedIds.size === 0 || loadingAccounts
                ? "bg-purple-600/40 text-purple-300/60 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
            }`}
          >
            {voting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Voting...
              </>
            ) : (
              <>
                <CoinsIcon className="h-4 w-4" />
                Vote ({selectedIds.size})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
