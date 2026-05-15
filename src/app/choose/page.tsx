"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PageWrapper from "../(components)/PageWrapper";
import { Shield, User, Loader2 } from "lucide-react";
import { STONE_Button } from "../../utils/CSS/Button.util";

export default function ChoosePage() {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [redirecting, setRedirecting] = useState<boolean>(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && !!session?.user?.is_admin === false) {
      router.push("/dashboard");
    }

    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, session, router]);

  const handleRoleSelection = (role: string) => {
    setSelectedRole(role);
    setRedirecting(true);

    setTimeout(() => {
      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    }, 500);
  };

  if (status === "loading") {
    return (
      <PageWrapper>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full p-8 bg-black/30 border border-stone-800 rounded-lg">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-medium text-white mb-2">
                Authenticating
              </h2>
              <p className="text-stone-400 text-sm">
                Please wait while we verify your credentials...
              </p>
              <div className="mt-6 flex justify-center">
                <div className="w-48 h-1.5 bg-stone-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full animate-pulse w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  // Show authenticating state while redirecting non-admin users
  if (status === "authenticated" && !!session?.user?.is_admin === false) {
    return (
      <PageWrapper>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full p-8 bg-black/30 border border-stone-800 rounded-lg">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-medium text-white mb-2">
                Authenticating
              </h2>
              <p className="text-stone-400 text-sm">
                Setting up your session...
              </p>
              <div className="mt-6 flex justify-center">
                <div className="w-48 h-1.5 bg-stone-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full animate-pulse w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full p-8 bg-black/30 border border-stone-800 rounded-lg">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-600/20 rounded-full">
                <Shield className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <h2 className="text-2xl font-medium text-white mb-2">
              Welcome, {session?.user?.username || "Admin"}!
            </h2>
            <p className="text-stone-400 text-sm">
              You have admin privileges. Choose how you want to proceed:
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleRoleSelection("admin")}
              disabled={redirecting}
              className={`w-full p-4 bg-blue-900 hover:bg-blue-950 border border-blue-800 hover:border-blue-900 rounded-lg text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group ${
                selectedRole === "admin"
                  ? "ring-2 ring-blue-500 bg-blue-600/30"
                  : ""
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-800 rounded-lg group-hover:bg-blue-900 transition-all">
                  <Shield className="h-6 w-6 text-blue-400" />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-lg font-medium block">Admin Panel</span>
                  <span className="text-sm text-stone-400">
                    Manage users, games, and system settings
                  </span>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelection("user")}
              disabled={redirecting}
              className={`w-full p-4 ${STONE_Button} rounded-lg text-white hover:bg-stone-700/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group ${
                selectedRole === "user"
                  ? "ring-2 ring-stone-400 bg-stone-700/50"
                  : ""
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-stone-800 rounded-lg group-hover:bg-stone-900 transition-all">
                  <User className="h-6 w-6 text-stone-400" />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-lg font-medium block">Dashboard</span>
                  <span className="text-sm text-stone-400">
                    Continue to your regular dashboard
                  </span>
                </div>
              </div>
            </button>
          </div>

          {redirecting && (
            <div className="mt-6 text-center">
              <div className="flex items-center justify-center space-x-2 text-stone-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">
                  Redirecting to{" "}
                  {selectedRole === "admin" ? "Admin Panel" : "Dashboard"}...
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
