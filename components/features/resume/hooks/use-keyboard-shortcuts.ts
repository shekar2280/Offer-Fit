"use client";

import { useEffect, useRef, useCallback } from "react";

interface ShortcutHandlers {
  onSubmit?: () => void;
  onFocusSearch?: () => void;
  onEscape?: () => void;
  disabled?: boolean;
}

export function useKeyboardShortcuts({
  onSubmit,
  onFocusSearch,
  onEscape,
  disabled = false,
}: ShortcutHandlers) {
  const handlersRef = useRef({ onSubmit, onFocusSearch, onEscape, disabled });
  handlersRef.current = { onSubmit, onFocusSearch, onEscape, disabled };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { onSubmit, onFocusSearch, onEscape, disabled } = handlersRef.current;
      if (disabled) return;

      const target = e.target as HTMLElement;
      const inInput = target.tagName === "INPUT" || target.tagName === "SELECT";
      const inTextarea = target.tagName === "TEXTAREA";
      const isMeta = e.metaKey || e.ctrlKey;

      if (isMeta && e.key === "Enter") {
        e.preventDefault();
        onSubmit?.();
        return;
      }

      if (isMeta && e.key === "k") {
        e.preventDefault();
        onFocusSearch?.();
        return;
      }

      if (e.key === "Escape" && !inInput && !inTextarea) {
        e.preventDefault();
        onEscape?.();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
