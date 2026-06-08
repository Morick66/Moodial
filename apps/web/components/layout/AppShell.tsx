import type { ReactNode } from "react";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="h-screen overflow-hidden bg-grid p-0 text-ink sm:p-3 lg:p-5">
      <div className="mx-auto grid h-full max-w-[1540px] grid-cols-1 overflow-hidden bg-white/35 shadow-shell backdrop-blur-2xl sm:h-[calc(100dvh-1.5rem)] sm:rounded-[2rem] sm:border sm:border-white/75 lg:grid-cols-[250px_1fr]">
        <SideNav />
        <div className="flex min-w-0 flex-col overflow-hidden">
          <TopBar />
          <section className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 sm:px-6 lg:px-8 lg:pb-8">{children}</section>
        </div>
      </div>
    </main>
  );
}
