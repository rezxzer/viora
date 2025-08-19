"use client";

import { Home, Newspaper, MessageSquare, User, Settings, Crown, Menu } from "lucide-react";
import NavItem from "./NavItem";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

/**
 * Sidebar with responsive mobile sheet.
 */
export default function Sidebar() {
  const [open, setOpen] = useState(false);

  const content = (
    <nav className="flex flex-col gap-1">
      <NavItem href="/" icon={<Home />} label="Home" onClick={() => setOpen(false)} />
      <NavItem href="/feed" icon={<Newspaper />} label="Feed" onClick={() => setOpen(false)} />
      <NavItem href="/chat" icon={<MessageSquare />} label="Chat" onClick={() => setOpen(false)} />
      <NavItem href="/profile" icon={<User />} label="Profile" onClick={() => setOpen(false)} />
      <NavItem href="/settings" icon={<Settings />} label="Settings" onClick={() => setOpen(false)} />
      <NavItem href="/premium" icon={<Crown />} label="Premium" onClick={() => setOpen(false)} />
    </nav>
  );

  return (
    <aside className="border-r bg-surface p-3 shadow-soft">
      {/* Desktop */}
      <div className="hidden lg:block min-w-[220px]">{content}</div>
      {/* Mobile trigger */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" aria-label="Open menu">
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-surface">
            {content}
          </SheetContent>
        </Sheet>
      </div>
    </aside>
  );
}


