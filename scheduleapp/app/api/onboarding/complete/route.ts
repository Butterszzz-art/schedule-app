import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { completeOnboarding } from "@/lib/onboarding";

// Marks onboarding done, whether the user finished it or skipped it --
// either way they're ready for Today/Week/Routine.
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await completeOnboarding(session.user.id);
  return NextResponse.json({ ok: true });
}
