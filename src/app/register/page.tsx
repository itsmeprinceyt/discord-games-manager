"use client";
import { useState, useRef, useEffect } from "react";
import PageWrapper from "../(components)/PageWrapper";
import Link from "next/link";
import { Eye, EyeOff, Check, X, AlertCircle } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import getAxiosErrorMessage from "../../utils/Variables/getAxiosError.util";
import prepareUsername from "../../utils/Validator/PrepareUsername.util";
import { isValidEmail } from "../../utils/Validator/NextAuth.util";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const [usernameError, setUsernameError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");

  const [usernameValidation, setUsernameValidation] = useState({
    checking: false,
    available: null as boolean | null,
    message: "",
    prepared: "",
  });

  const [usernameChecks, setUsernameChecks] = useState({
    minLength: false,
    maxLength: false,
    validFormat: false,
    noSpaces: false,
    noSpecialChars: false,
  });

  const router = useRouter();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkUsernameAvailability = (usernameToCheck: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      const trimmed = usernameToCheck.trim();
      if (!trimmed) {
        setUsernameValidation({
          checking: false,
          available: null,
          message: "",
          prepared: "",
        });
        return;
      }

      const prepared = prepareUsername(trimmed);
      setUsernameValidation((prev) => ({ ...prev, prepared }));

      if (prepared.length < 3 || prepared.length > 50 || !prepared) {
        setUsernameValidation({
          checking: false,
          available: false,
          message: "",
          prepared,
        });
        return;
      }

      setUsernameValidation((prev) => ({
        ...prev,
        checking: true,
        message: "Checking availability...",
      }));

      try {
        const response = await axios.post("/api/auth/check-username", {
          username: trimmed,
        });

        setUsernameValidation({
          checking: false,
          available: response.data.available,
          message: response.data.message,
          prepared,
        });
      } catch (err: unknown) {
        console.error("Error checking username:", err);
        setUsernameValidation({
          checking: false,
          available: null,
          message: "Unable to check availability",
          prepared,
        });
      }
    }, 500);
  };

  const updateUsernameChecks = (value: string) => {
    const trimmed = value.trim();
    const prepared = prepareUsername(trimmed);

    setUsernameChecks({
      minLength: prepared.length >= 3,
      maxLength: prepared.length <= 50,
      validFormat: prepared.length > 0,
      noSpaces: !value.includes(" "),
      noSpecialChars: prepared === trimmed.toLowerCase().replace(/\s+/g, "_"),
    });
  };

  const validateUsername = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setUsernameError("");
      setUsernameChecks({
        minLength: false,
        maxLength: false,
        validFormat: false,
        noSpaces: false,
        noSpecialChars: false,
      });
      return;
    }

    const prepared = prepareUsername(trimmed);

    updateUsernameChecks(value);

    if (prepared.length < 3) {
      setUsernameError("Username must be at least 3 characters");
    } else if (prepared.length > 50) {
      setUsernameError("Username must be less than 50 characters");
    } else if (!prepared) {
      setUsernameError("Invalid username format");
    } else {
      setUsernameError("");
    }

    checkUsernameAvailability(value);
  };

  const validateEmail = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setEmailError("");
      return;
    }

    if (!isValidEmail(trimmed)) {
      setEmailError("Invalid email format");
    } else {
      setEmailError("");
    }
  };

  const validatePassword = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setPasswordError("");
      return;
    }

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

  const validateConfirmPassword = (value: string) => {
    if (!value.trim()) {
      setConfirmPasswordError("");
      return;
    }

    if (value !== password) {
      setConfirmPasswordError("Passwords do not match");
    } else {
      setConfirmPasswordError("");
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    validateUsername(value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    validatePassword(value);
    if (confirmPassword) {
      validateConfirmPassword(confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setConfirmPassword(value);
    validateConfirmPassword(value);
  };

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (
      !trimmedUsername ||
      !trimmedEmail ||
      !trimmedPassword ||
      !trimmedConfirmPassword
    ) {
      setError("All fields are required");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError("Invalid email format");
      return;
    }

    const preparedUsername = prepareUsername(trimmedUsername);
    if (preparedUsername.length < 3 || preparedUsername.length > 50) {
      setError("Username must be between 3 and 50 characters");
      return;
    }

    if (trimmedPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(trimmedPassword)) {
      setError("Password must contain at least one letter and one number");
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (usernameValidation.checking) {
      setError("Please wait while we check username availability");
      return;
    }

    if (usernameValidation.available === false) {
      setError("Username is not available. Please choose a different one.");
      return;
    }

    if (usernameError || emailError || passwordError || confirmPasswordError) {
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("/api/auth/register", {
        username: trimmedUsername,
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (response.data.success) {
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setUsernameError("");
        setEmailError("");
        setPasswordError("");
        setConfirmPasswordError("");
        setUsernameValidation({
          checking: false,
          available: null,
          message: "",
          prepared: "",
        });

        toast.success(response.data.message);
        router.push("/login");
      }
    } catch (err: unknown) {
      const errorMessage = getAxiosErrorMessage(err, "Registration failed");
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (
      !trimmedUsername ||
      !trimmedEmail ||
      !trimmedPassword ||
      !trimmedConfirmPassword
    ) {
      return false;
    }

    if (usernameError || emailError || passwordError || confirmPasswordError) {
      return false;
    }

    if (!Object.values(usernameChecks).every(Boolean)) {
      return false;
    }

    if (usernameValidation.available === false) {
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
        <X className="h-3 w-3 text-gray-500" />
      )}
      <span
        className={
          checked
            ? "text-green-400"
            : error
            ? "text-yellow-400"
            : "text-gray-400"
        }
      >
        {label}
      </span>
    </div>
  );

  return (
    <PageWrapper>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full p-8 bg-black/30 border border-gray-800 rounded-lg">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-medium text-white mb-2">
              Register Now
            </h2>
            <p className="text-gray-400 text-sm">
              Join Games Manager Pro to manage and organize your games
              effortlessly.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  className={`w-full p-3 bg-gray-900/50 border ${
                    usernameError || usernameValidation.available === false
                      ? "border-red-600"
                      : usernameValidation.available === true
                      ? "border-green-600"
                      : "border-gray-700"
                  } rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-600`}
                  placeholder="Username"
                />
                {usernameValidation.checking && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
                {!usernameValidation.checking &&
                  usernameValidation.available === true && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Check className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                {!usernameValidation.checking &&
                  usernameValidation.available === false && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <X className="h-4 w-4 text-red-500" />
                    </div>
                  )}
              </div>

              {usernameValidation.available === true && (
                <div className="text-xs text-gray-400">
                  Username will be saved as:{" "}
                  <span className="text-blue-400 font-mono">
                    {usernameValidation.prepared}
                  </span>
                </div>
              )}

              {/* Username Availability Message */}
              {usernameValidation.message && !usernameError && (
                <div
                  className={`text-xs ${
                    usernameValidation.available === true
                      ? "text-green-500"
                      : usernameValidation.available === false
                      ? "text-red-500"
                      : "text-gray-400"
                  }`}
                >
                  {usernameValidation.message}
                </div>
              )}

              {/* Username Error */}
              {usernameError && (
                <p className="text-xs text-red-500">{usernameError}</p>
              )}

              {/* Username Requirements Checklist */}
              {username.trim() && (
                <div className="mt-2 p-3 bg-gray-900/30 rounded space-y-1">
                  <p className="text-xs text-gray-400 mb-2">
                    Username requirements:
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    <ChecklistItem
                      checked={usernameChecks.minLength}
                      label="At least 3 characters"
                      error={
                        username.trim().length > 0 && !usernameChecks.minLength
                      }
                    />
                    <ChecklistItem
                      checked={usernameChecks.maxLength}
                      label="Maximum 50 characters"
                      error={username.trim().length > 50}
                    />
                    <ChecklistItem
                      checked={usernameChecks.validFormat}
                      label="Valid format (letters, numbers, underscores)"
                      error={
                        username.trim().length > 0 &&
                        !usernameChecks.validFormat
                      }
                    />
                    <ChecklistItem
                      checked={usernameChecks.noSpaces}
                      label="No space between characters allowed"
                      error={false}
                    />
                    <ChecklistItem
                      checked={usernameChecks.noSpecialChars}
                      label="No special characters or emojis allowed"
                      error={
                        username.trim().length > 0 &&
                        !usernameChecks.noSpecialChars
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                className={`w-full p-3 bg-gray-900/50 border ${
                  emailError ? "border-red-600" : "border-gray-700"
                } rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-600`}
                placeholder="Email"
              />
              {emailError && (
                <p className="mt-1 text-xs text-red-500">{emailError}</p>
              )}
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                className={`w-full p-3 bg-gray-900/50 border ${
                  passwordError ? "border-red-600" : "border-gray-700"
                } rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-600 pr-10`}
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
              {passwordError && (
                <p className="mt-1 text-xs text-red-500">{passwordError}</p>
              )}
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                className={`w-full p-3 bg-gray-900/50 border ${
                  confirmPasswordError ? "border-red-600" : "border-gray-700"
                } rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-600 pr-10`}
                placeholder="Confirm Password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 cursor-pointer"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
              {confirmPasswordError && (
                <p className="mt-1 text-xs text-red-500">
                  {confirmPasswordError}
                </p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-900/30 border border-red-800 text-red-400 rounded text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className={`w-full p-3 ${
                loading || !isFormValid()
                  ? "bg-blue-900/50 cursor-not-allowed"
                  : "bg-blue-800 hover:bg-blue-900 cursor-pointer"
              } text-white rounded font-medium`}
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>

            <div className="text-center text-sm text-gray-400 mt-3">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-700 hover:text-blue-800">
                Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
}
