"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import axios from "axios";

import {
  heartBeatSessionExpiryKey,
  heartBeatSessionKey,
} from "../utils/Heartbeat/HeartBeatSession";
import { HEARTBEAT_SESSION_TTL } from "../utils/Heartbeat/sessionTTL";

const HeartbeatContent = () => {
  const pathname = usePathname();

  const triggerHeartbeat = async () => {
    try {
      const response = await axios.get("/api/public/heartbeat");
      if (response.data.success) {
        sessionStorage.setItem(heartBeatSessionKey(), "true");
        sessionStorage.setItem(
          heartBeatSessionExpiryKey(),
          (Date.now() + HEARTBEAT_SESSION_TTL).toString()
        );
      }
    } catch (error: unknown) {
      console.error("Heartbeat failed:", error);
    }
  };

  useEffect(() => {
    if (pathname === "/") {
      const expiry = sessionStorage.getItem(heartBeatSessionKey());
      const now = Date.now();

      if (!expiry || now > Number(expiry)) {
        setTimeout(() => {
          triggerHeartbeat();
        }, 500);
      }
    }
  }, [pathname]);

  return null;
};

const HomePageHeartbeat = dynamic(() => Promise.resolve(HeartbeatContent), {
  ssr: false,
  loading: () => null,
});

export default HomePageHeartbeat;
