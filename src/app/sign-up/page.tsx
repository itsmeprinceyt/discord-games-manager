// app/register/page.tsx
"use client";

import { useState } from "react";
import PageWrapper from "../(components)/PageWrapper";
import Link from "next/link";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setError("");

    // Simulate registration
    console.log("Registering user:", { username, email, password });

    // Reset form
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    alert("Registration submitted! Check console for details.");
  };

  return (
    <PageWrapper>
      <div className="p-8 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create Account</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border bg-rose-50 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border bg-rose-50 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="Enter email"
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

          <div className="relative">
            <label className="block mb-1 font-medium">Confirm Password:</label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border bg-rose-50 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500 pr-10"
              placeholder="Confirm password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-9 text-sm text-gray-600 hover:text-gray-800 cursor-pointer"
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            type="submit"
            className="w-full bg-rose-700 hover:bg-rose-900 text-white font-medium py-2.5 rounded transition-colors"
          >
            Sign Up
          </button>

          <div className="text-center mt-4">
            <p className="text-gray-600 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-rose-700 hover:text-rose-900 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
}