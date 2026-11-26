import { prisma } from "@/lib/db";

/** False for a missing settings row too -- safest default is "needs onboarding". */
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  return settings?.onboardingComplete ?? false;
}

export async function completeOnboarding(userId: string): Promise<void> {
  await prisma.userSettings.upsert({
    where: { userId },
    update: { onboardingComplete: true },
    create: { userId, onboardingComplete: true },
  });
}
