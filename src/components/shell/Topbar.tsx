"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import ThemeToggle from "./ThemeToggle";
import AuthStatus from "@/components/auth/AuthStatus";

/**
 * Topbar with brand, search placeholder, theme toggle, and user controls.
 */
export default function Topbar() {
  return (
    <header className="sticky top-0 z-30 border-b bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
      <div className="mx-auto flex max-w-screen-2xl items-center gap-3 px-4 py-3">
        <Link href="/" className="font-semibold">VIORA</Link>
        <div className="relative ml-auto hidden md:block w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search... (placeholder)" aria-label="Search" />
        </div>
        <ThemeToggle />
        <AuthStatus />
      </div>
    </header>
  );
}


