-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "phone" TEXT,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "payload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "appName" TEXT NOT NULL DEFAULT 'SuratAPP',
    "institutionName" TEXT NOT NULL DEFAULT 'Nama Institusi',
    "address" TEXT,
    "contact" TEXT,
    "defaultPassword" TEXT NOT NULL DEFAULT 'password123',
    "itemsPerPage" INTEGER NOT NULL DEFAULT 10,
    "logo" TEXT,
    "incomingLetterFormat" TEXT NOT NULL DEFAULT '{sequence}/{classificationCode}/{statusCode}/{year}',
    "outgoingLetterFormat" TEXT NOT NULL DEFAULT '{sequence}/{classificationCode}/{statusCode}/{year}',
    "whatsappTemplate" TEXT NOT NULL DEFAULT 'Assalamu''alaikum Wr. Wb.

Yth. {recipientName},
Kami informasikan mengenai surat dengan nomor {letterNumber} perihal "{subject}".

Tanggal Surat: {date}
Pengirim: {sender}
Penerima: {recipient}

Terima kasih.
Wassalamu''alaikum Wr. Wb.',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classifications" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "letter_statuses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "letter_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incoming_letters" (
    "id" TEXT NOT NULL,
    "agendaNumber" TEXT NOT NULL,
    "letterNumber" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subject" TEXT NOT NULL,
    "content" TEXT,
    "classificationId" TEXT,
    "statusId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incoming_letters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incoming_dispositions" (
    "id" TEXT NOT NULL,
    "incomingLetterId" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "dispositionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "target" TEXT NOT NULL,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incoming_dispositions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outgoing_letters" (
    "id" TEXT NOT NULL,
    "agendaNumber" TEXT NOT NULL,
    "letterNumber" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT,
    "classificationId" TEXT,
    "statusId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outgoing_letters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "incomingLetterId" TEXT,
    "outgoingLetterId" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "classifications_code_key" ON "classifications"("code");

-- CreateIndex
CREATE UNIQUE INDEX "letter_statuses_name_key" ON "letter_statuses"("name");

-- CreateIndex
CREATE UNIQUE INDEX "incoming_letters_agendaNumber_key" ON "incoming_letters"("agendaNumber");

-- CreateIndex
CREATE UNIQUE INDEX "outgoing_letters_agendaNumber_key" ON "outgoing_letters"("agendaNumber");

-- CreateIndex
CREATE INDEX "attachments_incomingLetterId_idx" ON "attachments"("incomingLetterId");

-- CreateIndex
CREATE INDEX "attachments_outgoingLetterId_idx" ON "attachments"("outgoingLetterId");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classifications" ADD CONSTRAINT "classifications_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter_statuses" ADD CONSTRAINT "letter_statuses_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incoming_letters" ADD CONSTRAINT "incoming_letters_classificationId_fkey" FOREIGN KEY ("classificationId") REFERENCES "classifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incoming_letters" ADD CONSTRAINT "incoming_letters_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "letter_statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incoming_letters" ADD CONSTRAINT "incoming_letters_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incoming_dispositions" ADD CONSTRAINT "incoming_dispositions_incomingLetterId_fkey" FOREIGN KEY ("incomingLetterId") REFERENCES "incoming_letters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incoming_dispositions" ADD CONSTRAINT "incoming_dispositions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outgoing_letters" ADD CONSTRAINT "outgoing_letters_classificationId_fkey" FOREIGN KEY ("classificationId") REFERENCES "classifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outgoing_letters" ADD CONSTRAINT "outgoing_letters_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "letter_statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outgoing_letters" ADD CONSTRAINT "outgoing_letters_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_incomingLetterId_fkey" FOREIGN KEY ("incomingLetterId") REFERENCES "incoming_letters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_outgoingLetterId_fkey" FOREIGN KEY ("outgoingLetterId") REFERENCES "outgoing_letters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

