"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PageWrapper from "../(components)/PageWrapper";
import { Eye, EyeOff } from "lucide-react";
import {
  BLUE_Button,
  BLUE_Text,
  BLUE_Text_Hover,
} from "../../utils/CSS/Button.util";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams.get("callbackUrl");

  const callbackUrl =
    rawCallbackUrl && rawCallbackUrl.startsWith("/")
      ? rawCallbackUrl
      : "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Invalid credentials");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full p-8 bg-black/30 border border-stone-800 rounded-lg">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-medium text-white mb-2">Login</h2>
            <p className="text-stone-400 text-sm">
              Enter your credentials to continue
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-400 rounded text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <input
                  id="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full p-3 bg-stone-900/50 border border-stone-700 rounded text-white placeholder-stone-500 focus:outline-none focus:border-blue-600"
                  placeholder="Email or username"
                />
              </div>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-stone-900/50 border border-stone-700 rounded text-white placeholder-stone-500 focus:outline-none focus:border-blue-600 pr-10 cursor-text"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-600 hover:text-stone-700 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full p-3 ${BLUE_Button} text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-stone-400">
            Forgot your password?{" "}
            <Link
              href="/forgot-password"
              className={`${BLUE_Text} ${BLUE_Text_Hover}`}
            >
              Click here
            </Link>
          </div>
          <div className="mt-3 text-center text-sm text-stone-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className={`${BLUE_Text} ${BLUE_Text_Hover}`}
            >
              Register now
            </Link>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
