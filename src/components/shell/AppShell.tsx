"use client";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

type Props = {
  children: React.ReactNode;
};

/**
 * AppShell: Composes Topbar and Sidebar with a responsive content area.
 */
export default function AppShell({ children }: Props) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Topbar />
      <div className="mx-auto grid max-w-screen-2xl grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[240px_1fr]">
        <Sidebar />
        <main className="min-h-[70vh] rounded-2xl bg-surface p-4 shadow-soft border">
          {children}
        </main>
      </div>
    </div>
  );
}


