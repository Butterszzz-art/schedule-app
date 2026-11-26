-- AlterTable
ALTER TABLE "PushSubscription" ADD COLUMN     "deviceToken" TEXT,
ADD COLUMN     "platform" TEXT NOT NULL DEFAULT 'web',
ALTER COLUMN "endpoint" DROP NOT NULL,
ALTER COLUMN "p256dh" DROP NOT NULL,
ALTER COLUMN "auth" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_deviceToken_key" ON "PushSubscription"("deviceToken");
