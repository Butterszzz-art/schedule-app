import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageTransition } from "@/components/layout/PageTransition";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Clears the fixed BottomNav (~64px + iOS home-indicator inset). */}
      <div
        className="flex flex-1 flex-col"
        style={{ paddingBottom: "calc(64px + env(safe-area-inset-bottom))" }}
      >
        <PageTransition>{children}</PageTransition>
      </div>
      <BottomNav />
    </>
  );
}
