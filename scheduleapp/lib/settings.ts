import { prisma } from "@/lib/db";

export const DEFAULT_REMINDER_TIME = "20:30";

export async function getReminderTime(userId: string): Promise<string> {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  return settings?.reminderTime ?? DEFAULT_REMINDER_TIME;
}

export async function setReminderTime(userId: string, reminderTime: string): Promise<void> {
  await prisma.userSettings.upsert({
    where: { userId },
    update: { reminderTime },
    create: { userId, reminderTime },
  });
}
