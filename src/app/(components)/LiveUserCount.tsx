"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { Users } from "lucide-react";

export default function LiveUserCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    axios
      .get("/api/stats")
      .then((res) => {
        if (mounted && res.data?.success) {
          setCount(res.data.data.total_users);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  if (count === null) return null;

  return (
    <div className="flex items-center justify-center gap-2 text-stone-400 text-xs mb-6">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 [animation-duration:2.5s]" />
        <span className="absolute inline-flex h-full w-full rounded-full blur-xs animate-[colorswap_6s_ease-in-out_infinite]" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 animate-[colorswap_6s_ease-in-out_infinite]" />
      </span>
      <Users className="w-3.5 h-3.5" />
      <span>
        {count.toLocaleString()} {count === 1 ? "user" : "users"} onboard
      </span>

      <style jsx>{`
        @keyframes colorswap {
          0%,
          45% {
            background-color: rgb(96 165 250);
          }
          50%,
          95% {
            background-color: rgb(250 204 21);
          }
          100% {
            background-color: rgb(96 165 250);
          }
        }
      `}</style>
    </div>
  );
}
