import type { ScheduleMode } from "@/lib/schedule/types";

export function ModeHeader({ mode }: { mode: ScheduleMode }) {
  const isPrep = mode === "prep";
  return (
    <div className="rounded-lg border border-[#E0900033] bg-[#1A1000] px-3 py-2.5">
      <p className="text-[11px] font-bold text-[#E09000]">
        {isPrep ? "🏆 PREP MODE ACTIVE" : "📅 Normal schedule"}
      </p>
      <p className="mt-0.5 text-[11px] text-foreground/50">
        {isPrep
          ? "Posing daily 06:30 · MA suspended · Cardio: Mon/Thu/Sat/Wed/Sun"
          : "Martial arts: Wed & Sun · Cardio: Mon/Thu/Sat"}
      </p>
    </div>
  );
}
