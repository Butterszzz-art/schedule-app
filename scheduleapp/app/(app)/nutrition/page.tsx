import { MEAL_GUIDE, NUTRITION_TARGETS } from "@/lib/nutrition";
import { Header } from "@/components/layout/Header";

// Training and rest days share one flat target during prep.
const t = NUTRITION_TARGETS.training;

export default function NutritionPage() {
  return (
    <>
      <Header title="Nutrition" />
      <main className="flex flex-col gap-5 px-5 pb-4">
        <div className="flex flex-col gap-3 rounded-xl border border-card-border bg-[#0E0E0E] p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-foreground/60">Every day</span>
            <span className="text-2xl font-bold text-accent">{t.calories} kcal</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Protein", value: t.protein, color: "#4ADE80" },
              { label: "Carbs", value: t.carbs },
              { label: "Fat", value: t.fat },
            ].map((m) => (
              <div key={m.label} className="rounded-lg bg-white/5 py-2">
                <div className="text-lg font-semibold" style={m.color ? { color: m.color } : undefined}>
                  ~{m.value}g
                </div>
                <div className="text-[11px] text-foreground/50">{m.label}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-foreground/50">
            Calories are fixed. Macros are a rough goal; they vary day to day.
          </p>
        </div>

        <p className="text-xs text-foreground/50">{MEAL_GUIDE}</p>

        <p className="text-xs text-foreground/40">
          Cardio is the last dial — only add if weekly average stalls despite
          diet adherence.
        </p>
      </main>
    </>
  );
}
