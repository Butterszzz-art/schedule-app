import type { ReactNode } from "react";
import { CATEGORY_BY_KEY } from "@/lib/tasks/categories";
import type { CategoryKey } from "@/lib/tasks/categories";

export function CategorySection({
  category,
  count,
  children,
}: {
  category: CategoryKey;
  count?: number;
  children: ReactNode;
}) {
  const cat = CATEGORY_BY_KEY[category];

  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center gap-2">
        <span
          className="rounded-full px-3 py-1 text-xs font-bold"
          style={{ background: `${cat.accent}18`, color: cat.accent }}
        >
          {cat.label}
        </span>
        {count != null && (
          <span className="text-xs text-foreground/40">
            {count} {count === 1 ? "task" : "tasks"}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}
