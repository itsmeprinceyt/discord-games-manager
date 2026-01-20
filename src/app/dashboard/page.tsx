"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MyJWT } from "@/types/User/JWT.type";
export default function Dashboard() {
  const { data: session, status, update } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: session?.user?.username || "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();

  const user = session?.user as MyJWT;

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const handleEdit = () => {
    setEditForm({
      username: user?.username || "",
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editForm.username.trim()) {
      setMessage({ type: 'error', text: 'Username is required' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: editForm.username,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await update(); // Refresh the session
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      username: user?.username || "",
    });
    setMessage(null);
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateDaysSince = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    const created = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You need to be signed in to view this page.</p>
          <Link
            href="/login"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user?.username || user?.email}</span>
              <button
                onClick={handleSignOut}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.username || user?.email}! 👋</h1>
          <p className="text-blue-100">
            Member since {formatDate(user?.created_at)} • {calculateDaysSince(user?.created_at)} days with us
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                {!isEditing && (
                  <button
                    onClick={handleEdit}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {message && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {message.text}
                </div>
              )}

              {/* Profile Form */}
              <div className="space-y-6">
                {/* User ID */}
                <div className="border-b pb-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">User ID</label>
                  <div className="flex items-center">
                    <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono text-gray-800">
                      {user?.id || "N/A"}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(user?.id || "");
                        setMessage({ type: 'success', text: 'User ID copied to clipboard!' });
                      }}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Username */}
                <div className="border-b pb-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Username</label>
                  {isEditing ? (
                    <div>
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        maxLength={50}
                      />
                      <p className="mt-1 text-xs text-gray-500">3-50 characters, letters, numbers, and underscores only</p>
                    </div>
                  ) : (
                    <p className="text-lg font-medium text-gray-900">{user?.username || "Not set"}</p>
                  )}
                </div>

                {/* Email */}
                <div className="border-b pb-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-medium text-gray-900">{user?.email || "N/A"}</p>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Verified</span>
                  </div>
                </div>

                {/* Account Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Account Created</label>
                    <p className="text-gray-900">{formatDate(user?.created_at)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                    <p className="text-gray-900">{user?.updated_at ? formatDate(user?.updated_at) : "Never updated"}</p>
                  </div>
                </div>

                {/* JWT Info (Collapsible) */}
                <div className="border-t pt-4">
                  <details className="group">
                    <summary className="flex justify-between items-center cursor-pointer list-none">
                      <span className="text-sm font-medium text-gray-500">Technical Details</span>
                      <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="mt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500">JWT Issued At</label>
                          <p className="text-sm font-mono">{user?.iat ? new Date(user.iat * 1000).toLocaleString() : "N/A"}</p>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">JWT Expires</label>
                          <p className="text-sm font-mono">{user?.exp ? new Date(user.exp * 1000).toLocaleString() : "N/A"}</p>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">JWT ID</label>
                          <p className="text-sm font-mono truncate">{user?.jti || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>

                {/* Edit Actions */}
                {isEditing && (
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </span>
                      ) : "Save Changes"}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Quick Actions */}
          <div className="space-y-8">
            {/* Account Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Account Age</span>
                  <span className="font-medium">{calculateDaysSince(user?.created_at)} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Email Verified</span>
                  <span className="text-green-600">✓</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/settings"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition group"
                >
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Settings</p>
                    <p className="text-sm text-gray-500">Manage account preferences</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <button
                  onClick={() => router.push('/security')}
                  className="flex items-center w-full p-3 rounded-lg hover:bg-gray-50 transition group"
                >
                  <div className="bg-red-100 p-2 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">Security</p>
                    <p className="text-sm text-gray-500">Change password & security</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Session Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Session</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Logged in as:</span>
                  <span className="font-medium truncate max-w-37.5">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Session expires:</span>
                  <span className="font-medium">
                    {user?.exp ? new Date(user.exp * 1000).toLocaleTimeString() : "N/A"}
                  </span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full mt-4 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition"
              >
                Sign Out All Devices
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}