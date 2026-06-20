-- Migrasi: ubah token template (Format Nomor Surat & Template WhatsApp)
-- dari bahasa Inggris ke bahasa Indonesia pada data setting yang sudah ada.
-- Token lama tetap didukung oleh aplikasi (backward compatibility), namun
-- data diseragamkan ke bahasa Indonesia.

-- Format Nomor Surat Masuk
UPDATE "settings"
SET "incomingLetterFormat" = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE("incomingLetterFormat", '{sequence}', '{nomorUrut}'),
      '{classificationCode}', '{kodeKlasifikasi}'
    ),
    '{statusCode}', '{kodeStatus}'
  ),
  '{year}', '{tahun}'
)
WHERE "incomingLetterFormat" IS NOT NULL;

-- Format Nomor Surat Keluar
UPDATE "settings"
SET "outgoingLetterFormat" = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE("outgoingLetterFormat", '{sequence}', '{nomorUrut}'),
      '{classificationCode}', '{kodeKlasifikasi}'
    ),
    '{statusCode}', '{kodeStatus}'
  ),
  '{year}', '{tahun}'
)
WHERE "outgoingLetterFormat" IS NOT NULL;

-- Template Notifikasi WhatsApp
UPDATE "settings"
SET "whatsappTemplate" = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE("whatsappTemplate", '{letterNumber}', '{nomorSurat}'),
                  '{agendaNumber}', '{nomorAgenda}'
                ),
                '{subject}', '{perihal}'
              ),
              '{date}', '{tanggal}'
            ),
            '{sender}', '{pengirim}'
          ),
          '{recipient}', '{penerima}'
        ),
        '{recipientName}', '{namaPenerima}'
      ),
      '{classification}', '{klasifikasi}'
    ),
    '{institutionName}', '{namaInstitusi}'
  )
)
WHERE "whatsappTemplate" IS NOT NULL;
