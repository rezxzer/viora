"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItemProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
};

/**
 * NavItem: A simple navigational item that highlights when active.
 */
export default function NavItem({ href, icon, label, onClick }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
        "hover:bg-elev/60 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        isActive ? "bg-elev/80 border-l-2 border-l-[var(--color-primary)]" : ""
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="text-muted-foreground group-hover:text-foreground inline-flex size-5 items-center justify-center">
        {icon}
      </span>
      <span className="hidden lg:inline-block">{label}</span>
    </Link>
  );
}


