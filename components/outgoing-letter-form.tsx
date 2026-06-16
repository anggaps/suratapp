"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createOutgoingLetter, updateOutgoingLetter } from "@/lib/actions/outgoing-letter.actions";
import { generateLetterNumber } from "@/lib/utils/letter-number";
import { AttachmentList } from "@/components/attachment-list";

const formSchema = z.object({
  agendaNumber: z.string().min(1, "Nomor agenda wajib diisi"),
  letterNumber: z.string().min(1, "Nomor surat wajib diisi"),
  recipient: z.string().min(1, "Penerima wajib diisi"),
  date: z.string().min(1, "Tanggal surat wajib diisi"),
  subject: z.string().min(1, "Perihal wajib diisi"),
  content: z.string().optional(),
  classificationId: z.string().optional(),
  statusId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface OutgoingLetterFormProps {
  letter?: {
    id: string;
    agendaNumber: string;
    letterNumber: string;
    recipient: string;
    date: Date;
    subject: string;
    content: string | null;
    classificationId: string | null;
    statusId: string | null;
    attachments: {
      id: string;
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      url: string;
    }[];
  };
  classifications: { id: string; code: string; name: string }[];
  statuses: { id: string; name: string }[];
  defaultLetterNumber?: string;
  letterNumberFormat?: string;
}

export function OutgoingLetterForm({
  letter,
  classifications,
  statuses,
  defaultLetterNumber = "",
  letterNumberFormat,
}: OutgoingLetterFormProps) {
  const isEdit = !!letter;
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: letter
      ? {
          agendaNumber: letter.agendaNumber,
          letterNumber: letter.letterNumber,
          recipient: letter.recipient,
          date: format(new Date(letter.date), "yyyy-MM-dd"),
          subject: letter.subject,
          content: letter.content ?? "",
          classificationId: letter.classificationId ?? undefined,
          statusId: letter.statusId ?? undefined,
        }
      : {
          letterNumber: defaultLetterNumber,
        },
  });

  const currentYear = watch("date") ? new Date(watch("date")).getFullYear() : new Date().getFullYear();

  const regenerateLetterNumber = async () => {
    setRegenerating(true);
    try {
      const generated = await generateLetterNumber({
        type: "outgoing",
        classificationId: watch("classificationId"),
        statusId: watch("statusId"),
        year: currentYear,
      });
      if (generated) {
        setValue("letterNumber", generated);
      }
    } finally {
      setRegenerating(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setError("");

    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });

    const fileInput = document.getElementById("attachments") as HTMLInputElement;
    if (fileInput?.files) {
      Array.from(fileInput.files).forEach((file) => {
        formData.append("attachments", file);
      });
    }

    try {
      const result = isEdit
        ? await updateOutgoingLetter(letter!.id, formData)
        : await createOutgoingLetter(formData);

      if (result && "error" in result) {
        const err = result.error as Record<string, string[]>;
        setError(Object.values(err).flat().join(", "));
        return;
      }

      toast.success(isEdit ? "Surat keluar berhasil diperbarui" : "Surat keluar berhasil ditambahkan");
    } catch (error) {
      if ((error as Error).message?.includes("NEXT_REDIRECT")) {
        return;
      }
      console.error(error);
      setError((error as Error).message || "Terjadi kesalahan");
      toast.error("Gagal menyimpan surat keluar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Surat Keluar" : "Tambah Surat Keluar"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="agendaNumber">Nomor Agenda</Label>
            <Input id="agendaNumber" {...register("agendaNumber")} />
            {errors.agendaNumber && (
              <p className="text-xs text-destructive">{errors.agendaNumber.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="letterNumber">Nomor Surat</Label>
            <div className="flex items-center gap-2">
              <Input id="letterNumber" {...register("letterNumber")} className="flex-1" />
              {!isEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={regenerateLetterNumber}
                  disabled={regenerating}
                  title="Generate ulang nomor surat"
                >
                  {regenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            {errors.letterNumber && (
              <p className="text-xs text-destructive">{errors.letterNumber.message}</p>
            )}
            {letterNumberFormat && (
              <p className="text-xs text-muted-foreground">
                Format: {letterNumberFormat}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipient">Penerima</Label>
            <Input id="recipient" {...register("recipient")} />
            {errors.recipient && (
              <p className="text-xs text-destructive">{errors.recipient.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Perihal</Label>
            <Input id="subject" {...register("subject")} />
            {errors.subject && (
              <p className="text-xs text-destructive">{errors.subject.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Tanggal Surat</Label>
            <Input id="date" type="date" {...register("date")} />
            {errors.date && (
              <p className="text-xs text-destructive">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Klasifikasi</Label>
            <div className="flex items-center gap-2">
              <Select
                value={watch("classificationId") ?? "__unset__"}
                onValueChange={(value) =>
                  setValue("classificationId", value === "__unset__" ? undefined : value)
                }
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Pilih klasifikasi" />
                </SelectTrigger>
                <SelectContent>
                  {classifications.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setValue("classificationId", undefined)}
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sifat Surat</Label>
            <div className="flex items-center gap-2">
              <Select
                value={watch("statusId") ?? "__unset__"}
                onValueChange={(value) =>
                  setValue("statusId", value === "__unset__" ? undefined : value)
                }
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Pilih sifat surat" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setValue("statusId", undefined)}
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="content">Isi Surat / Keterangan</Label>
            <Textarea id="content" rows={4} {...register("content")} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="attachments">Lampiran</Label>
            <Input id="attachments" type="file" multiple accept="*/*" />
            <p className="text-xs text-muted-foreground">
              Bisa pilih banyak file. File akan tersimpan di cloud storage bila sudah dikonfigurasi.
            </p>
          </div>
        </CardContent>
      </Card>

      {letter && letter.attachments.length > 0 && (
        <AttachmentList attachments={letter.attachments} />
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            "Simpan"
          )}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/surat-keluar">Batal</Link>
        </Button>
      </div>
    </form>
  );
}
