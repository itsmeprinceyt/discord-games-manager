"use client";

import { useState } from "react";
import PageWrapper from "../(components)/PageWrapper";
import Link from "next/link";

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailOrUsername || !password) {
      setError("Please fill in all fields");
      return;
    }

    setError("");

    console.log("Logging in with:", { emailOrUsername, password });

    setEmailOrUsername("");
    setPassword("");
    alert("Login submitted! Check console for details.");
  };

  return (
    <PageWrapper>
      <div className="p-8 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Login</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Email or Username:</label>
            <input
              type="text"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              className="w-full px-3 py-2 border bg-rose-50 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="Enter email or username"
            />
          </div>

          <div className="relative">
            <label className="block mb-1 font-medium">Password:</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border bg-rose-50 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500 pr-10"
              placeholder="Enter password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-sm text-gray-600 hover:text-gray-800 cursor-pointer"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            type="submit"
            className="w-full bg-rose-700 hover:bg-rose-900 text-white font-medium py-2.5 rounded transition-colors"
          >
            Login
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-gray-600 text-sm">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="text-rose-700 hover:text-rose-900 font-medium"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
