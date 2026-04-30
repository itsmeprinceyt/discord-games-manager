"use client";
import { useState, useEffect, useCallback } from "react";
import { SIDEBAR_STATE_KEY } from "../utils/main.util";

export function useSidebarStateCustom() {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    const load = () => {
      const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
      if (saved !== null) {
        setIsCollapsed(JSON.parse(saved));
      }
      setIsInitialized(true);
    };
    load();
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  return {
    isCollapsed,
    setIsCollapsed: toggleCollapsed,
    isMobileOpen,
    setIsMobileOpen,
    isInitialized,
  };
}
