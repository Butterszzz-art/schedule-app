import { NUTRITION_TARGETS, WEEKLY_AVERAGE_CALORIES } from "@/lib/nutrition";
import { Header } from "@/components/layout/Header";

const ROWS: { key: keyof typeof NUTRITION_TARGETS; trigger: string }[] = [
  { key: "heavy_lift", trigger: "Upper body (Mon/Thu/Sat)" },
  { key: "moderate_lift", trigger: "Lower body (Tue/Fri)" },
  { key: "rest", trigger: "MA days + rest (Wed/Sun)" },
];

export default function NutritionPage() {
  return (
    <>
      <Header title="Nutrition" />
      <main className="flex flex-col gap-5 px-5 pb-4">
        <div className="overflow-x-auto rounded-xl border border-card-border">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-card-border text-xs text-foreground/50">
                <th className="px-3 py-2 font-medium">Day type</th>
                <th className="px-3 py-2 font-medium">Trigger</th>
                <th className="px-3 py-2 font-medium">kcal</th>
                <th className="px-3 py-2 font-medium">Protein</th>
                <th className="px-3 py-2 font-medium">Carbs</th>
                <th className="px-3 py-2 font-medium">Fat</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(({ key, trigger }) => {
                const t = NUTRITION_TARGETS[key];
                return (
                  <tr key={key} className="border-b border-card-border/60 last:border-0">
                    <td className="px-3 py-2.5 font-medium">{t.label}</td>
                    <td className="px-3 py-2.5 text-foreground/60">{trigger}</td>
                    <td className="px-3 py-2.5">{t.calories}</td>
                    <td className="px-3 py-2.5" style={{ color: "#4ADE80" }}>
                      {t.protein}g
                    </td>
                    <td className="px-3 py-2.5">{t.carbs}g</td>
                    <td className="px-3 py-2.5">{t.fat}g</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-card-border bg-[#0E0E0E] p-4">
          <span className="text-sm text-foreground/60">Weekly average</span>
          <span className="text-lg font-bold text-accent">
            ~{WEEKLY_AVERAGE_CALORIES} kcal
          </span>
        </div>

        <p className="text-xs text-foreground/40">
          Cardio is the last dial — only add if weekly average stalls despite
          diet adherence.
        </p>
      </main>
    </>
  );
}
