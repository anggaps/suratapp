"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Building2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateSettings } from "@/lib/actions/settings.actions";

interface SettingsFormProps {
  settings: {
    appName: string;
    institutionName: string;
    address: string | null;
    contact: string | null;
    defaultPassword: string;
    itemsPerPage: number;
    logo: string | null;
    incomingLetterFormat: string;
    outgoingLetterFormat: string;
    whatsappTemplate: string;
  };
}

export default function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    appName: settings.appName,
    institutionName: settings.institutionName,
    address: settings.address ?? "",
    contact: settings.contact ?? "",
    defaultPassword: settings.defaultPassword,
    itemsPerPage: String(settings.itemsPerPage),
    incomingLetterFormat: settings.incomingLetterFormat,
    outgoingLetterFormat: settings.outgoingLetterFormat,
    whatsappTemplate: settings.whatsappTemplate,
  });
  const [logoPreview, setLogoPreview] = useState(settings.logo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const logoInput = document.getElementById("logo") as HTMLInputElement;
    if (logoInput?.files?.[0]) {
      formData.append("logo", logoInput.files[0]);
    }

    try {
      const result = await updateSettings(formData);

      if (result && "error" in result) {
        const err = result.error as Record<string, string[]>;
        setError(Object.values(err).flat().join(", "));
        return;
      }

      toast.success("Pengaturan berhasil disimpan");
    } catch (error) {
      console.error(error);
      setError((error as Error).message || "Terjadi kesalahan");
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setLoading(false);
      router.refresh();
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan Sistem</h1>
        <p className="text-muted-foreground">Konfigurasi identitas aplikasi dan preferensi sistem</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Identitas Aplikasi & Institusi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="Logo" className="h-16 w-16 rounded-md object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="logo" className="cursor-pointer">
                  <div className="rounded-md border px-3 py-2 text-sm hover:bg-muted">
                    Ganti Logo
                  </div>
                </Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="appName">Nama Aplikasi</Label>
                <Input
                  id="appName"
                  value={form.appName}
                  onChange={(e) => setForm({ ...form, appName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="institutionName">Nama Institusi</Label>
                <Input
                  id="institutionName"
                  value={form.institutionName}
                  onChange={(e) => setForm({ ...form, institutionName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Alamat</Label>
                <Textarea
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Kontak</Label>
                <Input
                  id="contact"
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferensi Sistem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="defaultPassword">Kata Sandi Bawaan</Label>
                <Input
                  id="defaultPassword"
                  value={form.defaultPassword}
                  onChange={(e) => setForm({ ...form, defaultPassword: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Digunakan untuk pengguna baru dan reset password.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemsPerPage">Jumlah Data per Halaman</Label>
                <Input
                  id="itemsPerPage"
                  type="number"
                  min={1}
                  max={100}
                  value={form.itemsPerPage}
                  onChange={(e) => setForm({ ...form, itemsPerPage: e.target.value })}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Format Nomor Surat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="incomingLetterFormat">Format Surat Masuk</Label>
                <Input
                  id="incomingLetterFormat"
                  value={form.incomingLetterFormat}
                  onChange={(e) => setForm({ ...form, incomingLetterFormat: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Token: {"{"}nomorUrut{"}"}, {"{"}kodeKlasifikasi{"}"}, {"{"}kodeStatus{"}"}, {"{"}tahun{"}"}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="outgoingLetterFormat">Format Surat Keluar</Label>
                <Input
                  id="outgoingLetterFormat"
                  value={form.outgoingLetterFormat}
                  onChange={(e) => setForm({ ...form, outgoingLetterFormat: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Token: {"{"}nomorUrut{"}"}, {"{"}kodeKlasifikasi{"}"}, {"{"}kodeStatus{"}"}, {"{"}tahun{"}"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Template Notifikasi WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsappTemplate">Template Pesan</Label>
              <Textarea
                id="whatsappTemplate"
                rows={6}
                value={form.whatsappTemplate}
                onChange={(e) => setForm({ ...form, whatsappTemplate: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Token: {"{"}nomorSurat{"}"}, {"{"}nomorAgenda{"}"}, {"{"}perihal{"}"}, {"{"}tanggal{"}"},
                {"{"}pengirim{"}"}, {"{"}penerima{"}"}, {"{"}namaPenerima{"}"}, {"{"}klasifikasi{"}"},
                {"{"}status{"}"}, {"{"}namaInstitusi{"}"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            "Simpan Pengaturan"
          )}
        </Button>
      </form>
    </div>
  );
}
