"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  const { data: session, status } = useSession();

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is logged in, show dashboard/home
  if (session) {
    return <AuthenticatedHome session={session} />;
  }

  // If user is not logged in, show landing page
  return <LandingPage />;
}

// Component for authenticated users
function AuthenticatedHome({ session }: { session: any }) {
  const user = session.user;

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation Bar for Authenticated Users */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  YourApp
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                Welcome back,{" "}
                <span className="font-semibold">
                  {user?.username || user?.email}
                </span>
              </div>
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition"
              >
                Dashboard
              </Link>
              <Link
                href="/profile"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition"
              >
                Profile
              </Link>
              <Link
                href="/api/auth/signout"
                className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition text-sm font-medium"
              >
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content for Authenticated Users */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6"
          >
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {user?.username || user?.email}
            </span>
            ! 👋
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto"
          >
            You're signed in as{" "}
            <span className="font-medium">{user?.email}</span>. Member since{" "}
            {formatDate(user?.created_at)}.
          </motion.p>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-20">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-blue-600 mb-2">📊</div>
              <div className="text-lg font-semibold text-gray-900 mb-1">
                Dashboard
              </div>
              <p className="text-gray-600 text-sm">View your stats</p>
              <Link
                href="/dashboard"
                className="inline-block mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Go to Dashboard →
              </Link>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-purple-600 mb-2">👤</div>
              <div className="text-lg font-semibold text-gray-900 mb-1">
                Profile
              </div>
              <p className="text-gray-600 text-sm">Manage your account</p>
              <Link
                href="/profile"
                className="inline-block mt-3 text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                Edit Profile →
              </Link>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-green-600 mb-2">⚙️</div>
              <div className="text-lg font-semibold text-gray-900 mb-1">
                Settings
              </div>
              <p className="text-gray-600 text-sm">Customize preferences</p>
              <Link
                href="/settings"
                className="inline-block mt-3 text-green-600 hover:text-green-700 text-sm font-medium"
              >
                Go to Settings →
              </Link>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-orange-600 mb-2">🔒</div>
              <div className="text-lg font-semibold text-gray-900 mb-1">
                Security
              </div>
              <p className="text-gray-600 text-sm">Protect your account</p>
              <Link
                href="/security"
                className="inline-block mt-3 text-orange-600 hover:text-orange-700 text-sm font-medium"
              >
                Security Settings →
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="text-left mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Your Recent Activity
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-lg mr-3">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Successfully logged in
                      </p>
                      <p className="text-sm text-gray-500">Just now</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-2 rounded-lg mr-3">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Last session</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(user?.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                YourApp
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                © 2024 YourApp. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Dashboard
              </Link>
              <Link
                href="/profile"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Profile
              </Link>
              <Link
                href="/settings"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Settings
              </Link>
              <Link
                href="/help"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Help Center
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Component for non-authenticated users (Landing Page)
function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  YourApp
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition text-sm font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6"
          >
            Welcome to{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              YourApp
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto"
          >
            A modern platform that helps you achieve more with less effort. Join
            thousands of users who are already experiencing the difference.
          </motion.p>

          {/* Call to Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Link
              href="/register"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg hover:opacity-90 transition text-lg font-medium shadow-lg hover:shadow-xl"
            >
              Start Free Trial
            </Link>
            <Link
              href="/features"
              className="bg-white text-gray-700 border border-gray-300 px-8 py-3 rounded-lg hover:bg-gray-50 transition text-lg font-medium"
            >
              Learn More
            </Link>
          </motion.div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-blue-600 mb-2">10K+</div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                99.9%
              </div>
              <div className="text-gray-600">Uptime</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
              <div className="text-gray-600">Support</div>
            </div>
          </div>

          {/* Features Preview */}
          <div className="text-left mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Why Choose Us?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Fast & Reliable
                </h3>
                <p className="text-gray-600">
                  Lightning-fast performance with 99.9% uptime guarantee.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Secure
                </h3>
                <p className="text-gray-600">
                  Enterprise-grade security with end-to-end encryption.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Trusted
                </h3>
                <p className="text-gray-600">
                  Trusted by thousands of users worldwide.
                </p>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Join our community and start your journey today. No credit card
              required for the free trial.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition text-lg font-medium"
              >
                Create Free Account
              </Link>
              <Link
                href="/demo"
                className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg hover:bg-white/10 transition text-lg font-medium"
              >
                Watch Demo
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                YourApp
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                © 2024 YourApp. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              <Link
                href="/privacy"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Terms of Service
              </Link>
              <Link
                href="/contact"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Contact
              </Link>
              <Link
                href="/about"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                About
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
