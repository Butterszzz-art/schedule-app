import Link from "next/link";
import type { NutritionDayType, NutritionTarget } from "@/lib/nutrition";
import type { TodayBlockView } from "@/lib/schedule/types";
import { formatHM } from "@/lib/time";

const CARB_COLOR: Record<NutritionDayType, string> = {
  training: "#4ADE80",
  rest: "#FBBF24",
};

function MacroPill({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 rounded-lg bg-[#141414] py-2">
      <span className="text-sm font-bold tabular-nums" style={{ color }}>
        {value}
        {unit}
      </span>
      <span className="text-[10px] text-foreground/40">{label}</span>
    </div>
  );
}

export function NutritionCard({
  dayType,
  target,
  mealBlocks,
  nextMealId,
}: {
  dayType: NutritionDayType;
  target: NutritionTarget;
  mealBlocks: TodayBlockView[];
  nextMealId: string | null;
}) {
  const carbColor = CARB_COLOR[dayType];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-card-border bg-[#1C1408] p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wide text-[#C8962A]">
          {target.label}
        </span>
        <Link
          href="/nutrition"
          className="text-[10px] font-semibold text-foreground/40"
        >
          Details ›
        </Link>
      </div>

      <div className="flex gap-2">
        <MacroPill label="kcal" value={target.calories} unit="" color="#F0EDE8" />
        <MacroPill label="protein" value={target.protein} unit="g" color="#4ADE80" />
        <MacroPill label="carbs" value={target.carbs} unit="g" color={carbColor} />
        <MacroPill label="fat" value={target.fat} unit="g" color="#F0EDE8" />
      </div>

      <p className="text-[11px] text-foreground/40">
        Protein: 164g every day regardless of calories
      </p>

      {mealBlocks.length > 0 && (
        <div className="flex flex-wrap gap-x-1.5 gap-y-1 border-t border-[#2A2010] pt-2.5 text-xs">
          {mealBlocks.map((meal, i) => (
            <span
              key={meal.id}
              className="font-semibold"
              style={{
                color: meal.id === nextMealId ? "#C8F060" : "#F0EDE8AA",
              }}
            >
              M{i + 1} {formatHM(meal.start)}
              {i < mealBlocks.length - 1 ? " ·" : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
