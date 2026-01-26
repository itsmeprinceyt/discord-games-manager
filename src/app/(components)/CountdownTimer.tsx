"use client";
import { useState, useEffect } from "react";

interface CountdownTimerProps {
  startDate: string | null;
  cooldownDays?: number;
}

export default function CountdownTimer({
  startDate,
  cooldownDays = 10,
}: CountdownTimerProps) {
  const [countdown, setCountdown] = useState<string>("--");

  useEffect(() => {
    const load = () => {
      if (!startDate) {
        setCountdown("--");
        return;
      }

      const calculateTimeLeft = () => {
        try {
          const start = new Date(startDate);
          const target = new Date(start);
          target.setDate(start.getDate() + cooldownDays);

          const now = new Date();
          const diffMs = target.getTime() - now.getTime();

          if (diffMs <= 0) {
            setCountdown("READY");
            return;
          }

          const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

          if (days > 0) {
            setCountdown(`${days} Days ${hours} Hours ${minutes} Minutes`);
          } else if (hours > 0) {
            setCountdown(`${hours} Hours ${minutes} Minutes`);
          } else if (minutes > 0) {
            setCountdown(`${minutes} Minutes`);
          } else {
            setCountdown("Less than 1 minute");
          }
        } catch {
          setCountdown("--");
        }
      };

      calculateTimeLeft();
      const interval = setInterval(calculateTimeLeft, 60000);

      return () => clearInterval(interval);
    };

    load();
  }, [startDate, cooldownDays]);

  const isReady = countdown === "READY";

  return (
    <span
      className={`font-medium ${isReady ? "text-green-400" : "text-stone-200"}`}
    >
      {countdown}
    </span>
  );
}
