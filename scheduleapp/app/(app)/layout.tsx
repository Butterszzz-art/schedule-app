import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/BottomNav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="flex-1 pb-4">{children}</div>
      <BottomNav />
    </>
  );
}
