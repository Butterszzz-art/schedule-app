import { BLUEPRINT_NOTES } from "@/lib/prep";

export function BlueprintNotes() {
  return (
    <div className="flex flex-col gap-2">
      {BLUEPRINT_NOTES.map((note) => (
        <div
          key={note.title}
          className="rounded-xl border border-card-border bg-[#0E0E0E] p-3"
        >
          <p className="text-sm font-semibold">{note.title}</p>
          <p className="mt-1 text-xs text-foreground/50">{note.body}</p>
        </div>
      ))}
    </div>
  );
}
