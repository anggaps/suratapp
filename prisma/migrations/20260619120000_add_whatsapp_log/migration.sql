-- CreateTable
CREATE TABLE "whatsapp_logs" (
    "id" TEXT NOT NULL,
    "letterType" TEXT NOT NULL,
    "letterId" TEXT NOT NULL,
    "recipientName" TEXT,
    "recipientPhone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sentById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "whatsapp_logs_letterType_letterId_idx" ON "whatsapp_logs"("letterType", "letterId");

-- CreateIndex
CREATE INDEX "whatsapp_logs_createdAt_idx" ON "whatsapp_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "whatsapp_logs" ADD CONSTRAINT "whatsapp_logs_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;