"use client";

import { useState } from "react";
import PageWrapper from "../(components)/PageWrapper";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full p-8 bg-black/30 border border-gray-800 rounded-lg">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-medium text-white mb-2">
              Create Account
            </h2>
            <p className="text-gray-400 text-sm">
              Sign up for Games Manager Pro
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
                placeholder="Username"
              />
            </div>

            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
                placeholder="Email"
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-600 pr-10"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-600 pr-10"
                placeholder="Confirm Password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-900/30 border border-red-800 text-red-400 rounded text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full p-3 bg-blue-800 hover:bg-blue-900 text-white rounded font-medium cursor-pointer"
            >
              Sign Up
            </button>

            <div className="text-center text-sm text-gray-400 mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-700 hover:text-blue-800">
                Sign in here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
}
