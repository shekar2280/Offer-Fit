"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
export function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const root = document.getElementById("hub-modal");
    const items = () =>
      Array.from(
        root?.querySelectorAll<HTMLElement>(
          "button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),a[href]",
        ) || [],
      );
    items()[0]?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key === "Tab") {
        const targets = items();
        const first = targets[0];
        const last = targets.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={close}
    >
      <div
        id="hub-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hub-modal-title"
        className="max-w-3xl mx-auto my-8 rounded-2xl border border-white/15 bg-[#101820] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="hub-modal-title" className="text-xl font-semibold">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            aria-label="Close dialog"
          >
            <X />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
