import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { currentWeightTarget, getCurrentPhase, SHOWS } from "@/lib/prep";
import { todayISODate } from "@/lib/time";
import { Header } from "@/components/layout/Header";
import { BlueprintNotes } from "@/components/prep/BlueprintNotes";
import { CutSignals } from "@/components/prep/CutSignals";
import { PhaseTimeline } from "@/components/prep/PhaseTimeline";
import { PrepHeader } from "@/components/prep/PrepHeader";
import { PriorityGaps } from "@/components/prep/PriorityGaps";
import { ShowCard } from "@/components/prep/ShowCard";
import { WeightTracker } from "@/components/prep/WeightTracker";

export default async function PrepPage() {
  const session = await auth();
  const userId = session!.user.id;

  const today = todayISODate();

  const entries = await prisma.weightEntry.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 10,
  });

  const currentPhase = getCurrentPhase(today);
  const weeklyTarget = currentWeightTarget(today);
  const currentWeight = entries[0]?.weight ?? null;

  return (
    <>
      <Header title="Prep" />
      <main className="flex flex-col gap-5 px-5 pb-4">
        <PrepHeader
          today={today}
          currentPhase={currentPhase}
          currentWeight={currentWeight}
        />
        <div className="overflow-x-auto">
          <PhaseTimeline today={today} />
        </div>
        <WeightTracker
          today={today}
          weeklyTarget={weeklyTarget}
          initialEntries={entries.map((e) => ({ date: e.date, weight: e.weight }))}
        />
        <div className="flex flex-col gap-3">
          {SHOWS.map((show) => (
            <ShowCard key={show.name} show={show} today={today} />
          ))}
        </div>
        <PriorityGaps />
        <CutSignals />
        <BlueprintNotes />
      </main>
    </>
  );
}
