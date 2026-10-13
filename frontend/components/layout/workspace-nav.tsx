"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  LayoutDashboard,
  ScanText,
  History,
} from "lucide-react";

const sections = [
  { href: "/", label: "Overview", icon: LayoutDashboard, paths: ["/"] },
  {
    href: "/analyze",
    label: "Analyze & tailor",
    icon: ScanText,
    paths: ["/analyze", "/customize"],
  },
  {
    href: "/hub",
    label: "Applications",
    icon: BriefcaseBusiness,
    paths: ["/hub"],
  },
  { href: "/history", label: "History", icon: History, paths: ["/history"] },
];

export function WorkspaceNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main workspace"
      className="border-b border-white/[0.06] bg-background"
    >
      <div className="mx-auto flex max-w-[1440px] gap-1 overflow-x-auto px-4 sm:px-6">
        {sections.map(({ href, label, icon: Icon, paths }) => {
          const active = paths.includes(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-4 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${active ? "border-primary text-primary" : "border-transparent text-white/50 hover:text-white"}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
