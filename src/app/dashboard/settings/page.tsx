"use client";
import React, { useState } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  Save,
  Loader2Icon,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import getAxiosErrorMessage from "../../../utils/Variables/getAxiosError.util";
import PageWrapper from "../../(components)/PageWrapper";

export default function SettingsPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [showCurrentPassword, setShowCurrentPassword] =
    useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordError, setPasswordError] = useState<string>("");
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");

  const [passwordChecks, setPasswordChecks] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const validatePassword = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setPasswordError("");
      setPasswordChecks({
        minLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false,
      });
      return;
    }

    setPasswordChecks({
      minLength: trimmed.length >= 8,
      hasUpperCase: /[A-Z]/.test(trimmed),
      hasLowerCase: /[a-z]/.test(trimmed),
      hasNumber: /[0-9]/.test(trimmed),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(trimmed),
    });

    if (trimmed.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(trimmed)) {
      setPasswordError("Must contain at least one letter and one number");
    } else {
      setPasswordError("");
    }
  };

  const validateConfirmPassword = (
    confirmValue: string,
    newPasswordValue?: string
  ) => {
    const newPwd =
      newPasswordValue !== undefined ? newPasswordValue : formData.newPassword;
    const trimmed = confirmValue.trim();

    if (!trimmed) {
      setConfirmPasswordError("");
      return;
    }

    if (trimmed !== newPwd) {
      setConfirmPasswordError("Passwords do not match");
    } else {
      setConfirmPasswordError("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const newFormData = {
        ...prev,
        [name]: value,
      };
      return newFormData;
    });

    // Handle validation based on which field changed
    if (name === "newPassword") {
      validatePassword(value);
      // Re-validate confirm password if it has a value
      if (formData.confirmPassword) {
        validateConfirmPassword(formData.confirmPassword, value);
      }
    }

    if (name === "confirmPassword") {
      validateConfirmPassword(value);
    }
  };

  const isPasswordValid = () => {
    return Object.values(passwordChecks).every(Boolean);
  };

  const isFormValid = () => {
    const trimmedCurrent = formData.currentPassword.trim();
    const trimmedNew = formData.newPassword.trim();
    const trimmedConfirm = formData.confirmPassword.trim();

    if (!trimmedCurrent || !trimmedNew || !trimmedConfirm) {
      return false;
    }

    if (passwordError || confirmPasswordError) {
      return false;
    }

    if (!isPasswordValid()) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("/api/auth/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (response.data.success) {
        toast.success("Password changed successfully!");
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setPasswordError("");
        setConfirmPasswordError("");
        setPasswordChecks({
          minLength: false,
          hasUpperCase: false,
          hasLowerCase: false,
          hasNumber: false,
          hasSpecialChar: false,
        });
      }
    } catch (err: unknown) {
      const message = getAxiosErrorMessage(err, "Error changing password");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper withSidebar sidebarRole="user">
      <div className="min-h-screen p-4 md:p-6 flex flex-col items-center justify-center">
        {/* Settings Content */}
        <div className="max-w-2xl">
          {/* Password Change Section */}
          <div className="bg-linear-to-b from-stone-900/50 to-transparent border border-stone-800 rounded-lg overflow-hidden">
            {/* Section Header */}
            <div className="p-6 border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600/10">
                  <Lock className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-white font-medium">Change Password</h2>
                  <p className="text-stone-500 text-sm mt-0.5">
                    Update your password to keep your account secure
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Current Password */}
              <div className="space-y-2">
                <label className="block text-sm text-stone-300">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    className="w-full p-3 pr-10 bg-black/30 border border-stone-700 rounded-lg text-white placeholder-stone-600 focus:outline-none focus:border-blue-600 transition-colors"
                    placeholder="Enter your current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-400 transition-colors"
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-3">
                <label className="block text-sm text-stone-300">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className={`w-full p-3 pr-10 bg-black/30 border ${
                      passwordError ? "border-red-600" : "border-stone-700"
                    } rounded-lg text-white placeholder-stone-600 focus:outline-none focus:border-blue-600 transition-colors`}
                    placeholder="Enter your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-400 transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {passwordError && (
                  <p className="text-xs text-red-500">{passwordError}</p>
                )}

                {/* Password Requirements Checklist */}
                {formData.newPassword.length > 0 && (
                  <div className="mt-3 p-4 bg-black/30 border border-stone-800 rounded-lg">
                    <p className="text-xs text-stone-400 mb-3">
                      Password requirements:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <ChecklistItem
                        checked={passwordChecks.minLength}
                        label="At least 8 characters"
                        error={
                          formData.newPassword.length > 0 &&
                          !passwordChecks.minLength
                        }
                      />
                      <ChecklistItem
                        checked={passwordChecks.hasUpperCase}
                        label="One uppercase letter"
                        error={
                          formData.newPassword.length > 0 &&
                          !passwordChecks.hasUpperCase
                        }
                      />
                      <ChecklistItem
                        checked={passwordChecks.hasLowerCase}
                        label="One lowercase letter"
                        error={
                          formData.newPassword.length > 0 &&
                          !passwordChecks.hasLowerCase
                        }
                      />
                      <ChecklistItem
                        checked={passwordChecks.hasNumber}
                        label="One number"
                        error={
                          formData.newPassword.length > 0 &&
                          !passwordChecks.hasNumber
                        }
                      />
                      <ChecklistItem
                        checked={passwordChecks.hasSpecialChar}
                        label="One special character"
                        error={
                          formData.newPassword.length > 0 &&
                          !passwordChecks.hasSpecialChar
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="block text-sm text-stone-300">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full p-3 pr-10 bg-black/30 border rounded-lg text-white placeholder-stone-600 focus:outline-none transition-colors ${
                      confirmPasswordError
                        ? "border-red-600 focus:border-red-600"
                        : formData.confirmPassword.length > 0 &&
                          formData.confirmPassword === formData.newPassword
                        ? "border-green-600 focus:border-green-600"
                        : "border-stone-700 focus:border-blue-600"
                    }`}
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-400 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>

                {confirmPasswordError && (
                  <p className="text-xs text-red-500">{confirmPasswordError}</p>
                )}

                {/* Password Match Indicator */}
                {formData.confirmPassword.length > 0 &&
                  !confirmPasswordError &&
                  formData.newPassword === formData.confirmPassword && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Check className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-500">
                        Passwords match
                      </span>
                    </div>
                  )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || !isFormValid()}
                  className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    loading || !isFormValid()
                      ? "bg-stone-800 text-stone-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2Icon size={16} className="animate-spin" />
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Change Password
                    </>
                  )}
                </button>
              </div>

              {/* Password Changed Info */}
              <div className="text-center">
                <p className="text-xs text-stone-500">
                  After changing your password, you&apos;ll need to use it the
                  next time you log in
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
