"use client";

import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { STONE_Button } from "../utils/CSS/Button.util";

export default function NotFound() {
  const router = useRouter();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen p-4 flex items-center justify-center bg-black">
      <div className="max-w-md w-full">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">404</h1>
          <p className="text-stone-400 mb-8 text-xs">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
          <button
            onClick={handleGoBack}
            className={`${STONE_Button} px-6 py-2  text-white rounded-lg transition-colors cursor-pointer`}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
