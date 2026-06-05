import type { ReactNode } from "react";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="h-screen overflow-hidden bg-grid px-3 py-3 text-ink sm:px-5">
      <div className="mx-auto flex h-[calc(100dvh-1.5rem)] max-w-[1320px] flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/55 shadow-shell backdrop-blur-xl">
        <TopBar />
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[96px_1fr]">
          <SideNav />
          <section className="min-h-0 overflow-y-auto p-4 sm:p-5 lg:p-6">{children}</section>
        </div>
      </div>
    </main>
  );
}
