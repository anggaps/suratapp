-- Migrasi: ubah token template (Format Nomor Surat & Template WhatsApp)
-- dari bahasa Inggris ke bahasa Indonesia pada data setting yang sudah ada.
-- Token lama tetap didukung oleh aplikasi (backward compatibility), namun
-- data diseragamkan ke bahasa Indonesia.
--
-- Setiap UPDATE mengganti satu token pada satu kolom, dijalankan berurutan.

-- Format Nomor Surat Masuk: {sequence} -> {nomorUrut}
UPDATE "settings"
SET "incomingLetterFormat" = REPLACE("incomingLetterFormat", '{sequence}', '{nomorUrut}')
WHERE "incomingLetterFormat" IS NOT NULL;

-- Format Nomor Surat Masuk: {classificationCode} -> {kodeKlasifikasi}
UPDATE "settings"
SET "incomingLetterFormat" = REPLACE("incomingLetterFormat", '{classificationCode}', '{kodeKlasifikasi}')
WHERE "incomingLetterFormat" IS NOT NULL;

-- Format Nomor Surat Masuk: {statusCode} -> {kodeStatus}
UPDATE "settings"
SET "incomingLetterFormat" = REPLACE("incomingLetterFormat", '{statusCode}', '{kodeStatus}')
WHERE "incomingLetterFormat" IS NOT NULL;

-- Format Nomor Surat Masuk: {year} -> {tahun}
UPDATE "settings"
SET "incomingLetterFormat" = REPLACE("incomingLetterFormat", '{year}', '{tahun}')
WHERE "incomingLetterFormat" IS NOT NULL;

-- Format Nomor Surat Keluar: {sequence} -> {nomorUrut}
UPDATE "settings"
SET "outgoingLetterFormat" = REPLACE("outgoingLetterFormat", '{sequence}', '{nomorUrut}')
WHERE "outgoingLetterFormat" IS NOT NULL;

-- Format Nomor Surat Keluar: {classificationCode} -> {kodeKlasifikasi}
UPDATE "settings"
SET "outgoingLetterFormat" = REPLACE("outgoingLetterFormat", '{classificationCode}', '{kodeKlasifikasi}')
WHERE "outgoingLetterFormat" IS NOT NULL;

-- Format Nomor Surat Keluar: {statusCode} -> {kodeStatus}
UPDATE "settings"
SET "outgoingLetterFormat" = REPLACE("outgoingLetterFormat", '{statusCode}', '{kodeStatus}')
WHERE "outgoingLetterFormat" IS NOT NULL;

-- Format Nomor Surat Keluar: {year} -> {tahun}
UPDATE "settings"
SET "outgoingLetterFormat" = REPLACE("outgoingLetterFormat", '{year}', '{tahun}')
WHERE "outgoingLetterFormat" IS NOT NULL;

-- Template WhatsApp: {letterNumber} -> {nomorSurat}
UPDATE "settings"
SET "whatsappTemplate" = REPLACE("whatsappTemplate", '{letterNumber}', '{nomorSurat}')
WHERE "whatsappTemplate" IS NOT NULL;

-- Template WhatsApp: {agendaNumber} -> {nomorAgenda}
UPDATE "settings"
SET "whatsappTemplate" = REPLACE("whatsappTemplate", '{agendaNumber}', '{nomorAgenda}')
WHERE "whatsappTemplate" IS NOT NULL;

-- Template WhatsApp: {subject} -> {perihal}
UPDATE "settings"
SET "whatsappTemplate" = REPLACE("whatsappTemplate", '{subject}', '{perihal}')
WHERE "whatsappTemplate" IS NOT NULL;

-- Template WhatsApp: {date} -> {tanggal}
UPDATE "settings"
SET "whatsappTemplate" = REPLACE("whatsappTemplate", '{date}', '{tanggal}')
WHERE "whatsappTemplate" IS NOT NULL;

-- Template WhatsApp: {sender} -> {pengirim}
UPDATE "settings"
SET "whatsappTemplate" = REPLACE("whatsappTemplate", '{sender}', '{pengirim}')
WHERE "whatsappTemplate" IS NOT NULL;

-- Template WhatsApp: {recipientName} -> {namaPenerima}
-- (harus sebelum {recipient} -> {penerima} karena {recipient} adalah substring dari {recipientName})
UPDATE "settings"
SET "whatsappTemplate" = REPLACE("whatsappTemplate", '{recipientName}', '{namaPenerima}')
WHERE "whatsappTemplate" IS NOT NULL;

-- Template WhatsApp: {recipient} -> {penerima}
UPDATE "settings"
SET "whatsappTemplate" = REPLACE("whatsappTemplate", '{recipient}', '{penerima}')
WHERE "whatsappTemplate" IS NOT NULL;

-- Template WhatsApp: {classification} -> {klasifikasi}
UPDATE "settings"
SET "whatsappTemplate" = REPLACE("whatsappTemplate", '{classification}', '{klasifikasi}')
WHERE "whatsappTemplate" IS NOT NULL;

-- Template WhatsApp: {institutionName} -> {namaInstitusi}
UPDATE "settings"
SET "whatsappTemplate" = REPLACE("whatsappTemplate", '{institutionName}', '{namaInstitusi}')
WHERE "whatsappTemplate" IS NOT NULL;
