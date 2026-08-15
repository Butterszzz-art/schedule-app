"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Keying by pathname remounts this div on every tab switch, restarting
  // the CSS fade-in animation each time.
  return (
    <div key={pathname} className="animate-page-fade-in flex flex-1 flex-col">
      {children}
    </div>
  );
}
