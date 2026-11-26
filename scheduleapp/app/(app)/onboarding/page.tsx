import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasCompletedOnboarding } from "@/lib/onboarding";
import { OnboardingClient } from "@/components/onboarding/OnboardingClient";

export default async function OnboardingPage() {
  const session = await auth();
  const userId = session!.user.id;

  if (await hasCompletedOnboarding(userId)) {
    redirect("/today");
  }

  return <OnboardingClient />;
}
