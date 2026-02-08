"use client";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { MyJWT } from "../../types/User/JWT.type";
import {
  User,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
  Shield,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);

  const isAuthenticated = !!session;
  const user = session?.user as MyJWT | undefined;
  const isAdmin = user?.is_admin === 1;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  if (status === "loading") {
    return (
      <nav className="sticky top-0 z-50 border-b border-stone-800 bg-black backdrop-blur-sm">
        <div className="mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="animate-pulse bg-stone-800 h-6 w-20 rounded"></div>
            </div>
            <div className="animate-pulse bg-stone-800 h-8 w-8 rounded-full"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-stone-800 bg-black backdrop-blur-sm">
      <div className="mx-auto">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center px-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-semibold text-white">GMP</span>
            </Link>
          </div>

          {/* Desktop - User Profile Dropdown */}
          <div className="hidden md:block">
            <div className="relative px-4">
              <button
                onClick={toggleUserMenu}
                className="flex items-center space-x-2 rounded-full p-1 hover:bg-stone-950 transition-colors focus:outline-none cursor-pointer"
              >
                <div className="h-8 w-8 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-300">
                  {isAuthenticated ? (
                    user?.username?.[0]?.toUpperCase() ||
                    user?.email?.[0]?.toUpperCase() || (
                      <User className="h-4 w-4" />
                    )
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-stone-400" />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-stone-950 rounded-md shadow-lg border border-stone-800 z-50 mx-4">
                  {isAuthenticated ? (
                    <>
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-stone-800">
                        <p className="text-sm font-medium text-white truncate select-text">
                          @
                          {user?.username ||
                            user?.email?.split("@")[0] ||
                            "User"}
                        </p>
                        <p className="text-xs text-stone-400 truncate select-text">
                          {user?.email}
                        </p>
                        {isAdmin && (
                          <div className="mt-2 flex items-center space-x-1">
                            <Shield className="h-3 w-3 text-blue-400" />
                            <span className="text-xs text-blue-400">Admin</span>
                          </div>
                        )}
                      </div>

                      {/* Dashboard/Admin Panel */}
                      {isAdmin ? (
                        <>
                          <Link
                            href={"/admin"}
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-stone-300 hover:bg-stone-800 hover:text-white transition-colors"
                          >
                            <LayoutDashboard className="h-4 w-4 mr-3" />
                            Admin
                          </Link>
                          <Link
                            href={"/dashboard"}
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-stone-300 hover:bg-stone-800 hover:text-white transition-colors"
                          >
                            <LayoutDashboard className="h-4 w-4 mr-3" />
                            Dashboard
                          </Link>
                        </>
                      ) : (
                        <Link
                          href={"/dashboard"}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-stone-300 hover:bg-stone-800 hover:text-white transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4 mr-3" />
                          Dashboard
                        </Link>
                      )}

                      {/* Settings */}
                      <Link
                        href="/settings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-stone-300 hover:bg-stone-800 hover:text-white transition-colors"
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Settings
                      </Link>

                      {/* Sign Out */}
                      <div className="border-t border-stone-800">
                        <button
                          onClick={async () => {
                            setIsUserMenuOpen(false);
                            await signOut({ callbackUrl: "/login" });
                          }}
                          className="w-full flex items-center px-4 py-2 text-sm text-stone-300 hover:bg-stone-800 hover:text-white transition-colors cursor-pointer"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Sign out
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Sign In */}
                      <Link
                        href="/login"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center px-4 py-3 text-sm text-stone-300 hover:bg-stone-800 hover:text-white transition-colors border-b border-stone-800"
                      >
                        <LogIn className="h-4 w-4 mr-3" />
                        Sign In
                      </Link>

                      {/* Register */}
                      <Link
                        href="/register"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center px-4 py-3 text-sm text-stone-300 hover:bg-stone-800 hover:text-white transition-colors"
                      >
                        <UserPlus className="h-4 w-4 mr-3" />
                        Create Account
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden px-4">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-stone-400 hover:text-white hover:bg-stone-800/50 transition-colors focus:outline-none cursor-pointer"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-stone-800">
            {isAuthenticated ? (
              <>
                {/* User Info */}
                <div className="px-4 py-3 border-b border-stone-800">
                  <p className="text-sm font-medium text-white select-text">
                    @{user?.username || user?.email?.split("@")[0] || "User"}
                  </p>
                  <p className="text-xs text-stone-400 select-text">
                    {user?.email}
                  </p>
                  {isAdmin && (
                    <div className="mt-2 flex items-center space-x-1 ">
                      <Shield className="h-3 w-3 text-blue-400" />
                      <span className="text-xs text-blue-400">Admin</span>
                    </div>
                  )}
                </div>

                {/* Dashboard/Admin Panel */}
                {isAdmin ? (
                  <>
                    <Link
                      href={"/admin"}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-stone-300 hover:bg-stone-800 hover:text-white transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4 mr-3" />
                      Admin
                    </Link>
                    <Link
                      href={"/dashboard"}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-stone-300 hover:bg-stone-800 hover:text-white transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4 mr-3" />
                      Dashboard
                    </Link>
                  </>
                ) : (
                  <Link
                    href={"/dashboard"}
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-stone-300 hover:bg-stone-800 hover:text-white transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4 mr-3" />
                    Dashboard
                  </Link>
                )}

                {/* Settings */}
                <Link
                  href="/settings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 text-sm text-stone-300 hover:bg-stone-800 hover:text-white transition-colors"
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Settings
                </Link>

                {/* Sign Out */}
                <div className="border-t border-stone-800">
                  <button
                    onClick={async () => {
                      setIsUserMenuOpen(false);
                      await signOut({ callbackUrl: "/login" });
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-stone-300 hover:bg-stone-800 hover:text-white transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Sign In */}
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 text-sm text-stone-300 hover:bg-stone-800 hover:text-white transition-colors"
                >
                  <LogIn className="h-4 w-4 mr-3" />
                  Sign In
                </Link>

                {/* Register */}
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 text-sm text-stone-300 hover:bg-stone-800 hover:text-white transition-colors"
                >
                  <UserPlus className="h-4 w-4 mr-3" />
                  Create Account
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {/* Close dropdown when clicking outside */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </nav>
  );
}
