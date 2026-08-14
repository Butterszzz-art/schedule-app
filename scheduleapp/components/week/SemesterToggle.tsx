import type { SemesterKey } from "@/lib/schedule/types";

export function SemesterToggle({
  semester,
  onChange,
}: {
  semester: SemesterKey;
  onChange: (semester: SemesterKey) => void;
}) {
  const options: { value: SemesterKey; label: string }[] = [
    { value: 1, label: "Sem 1 · Sep–Oct" },
    { value: 2, label: "Sem 2 · Nov–Dec" },
  ];

  return (
    <div className="flex gap-2">
      {options.map((opt) => {
        const active = opt.value === semester;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              active
                ? "border-accent bg-accent/10 text-accent"
                : "border-card-border text-foreground/50"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
