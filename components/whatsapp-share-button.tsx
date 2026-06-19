"use client";

import { useState, useEffect, useMemo } from "react";
import { MessageCircle, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatWhatsAppTemplate,
  buildWhatsAppLink,
  cleanPhoneNumber,
  WhatsAppTemplateData,
} from "@/lib/utils/whatsapp";
import { recordWhatsappLog, type WhatsappLetterType } from "@/lib/actions/whatsapp.actions";
import { toast } from "sonner";

interface NotificationRecipient {
  id: string;
  name: string;
  phone: string;
}

interface WhatsAppShareButtonProps {
  recipients: NotificationRecipient[];
  template?: string;
  data: WhatsAppTemplateData;
  label?: string;
  letterType?: WhatsappLetterType;
  letterId?: string;
}

export function WhatsAppShareButton({
  recipients,
  template,
  data,
  label = "Kirim Notifikasi WA",
  letterType,
  letterId,
}: WhatsAppShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>("");
  const [customPhone, setCustomPhone] = useState("");

  const selectedRecipient = useMemo(
    () => recipients.find((r) => r.id === selectedRecipientId),
    [recipients, selectedRecipientId]
  );

  const phone = useMemo(() => {
    if (selectedRecipient) return selectedRecipient.phone;
    return customPhone;
  }, [selectedRecipient, customPhone]);

  const message = useMemo(() => {
    const recipientName = selectedRecipient?.name ?? data.recipientName ?? data.recipient;
    return formatWhatsAppTemplate(template ?? "", {
      ...data,
      recipientName,
    });
  }, [template, data, selectedRecipient]);

  const waLink = useMemo(
    () => (phone ? buildWhatsAppLink(phone, message) : ""),
    [phone, message]
  );

  const isPhoneValid = cleanPhoneNumber(phone).length > 0;

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedRecipientId("");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCustomPhone("");
    }
  }, [open]);

  const handleOpenWhatsApp = async () => {
    if (!waLink) return;
    window.open(waLink, "_blank", "noopener,noreferrer");

    if (letterType && letterId) {
      try {
        await recordWhatsappLog({
          letterType,
          letterId,
          recipientName: selectedRecipient?.name ?? null,
          recipientPhone: cleanPhoneNumber(phone),
          message,
        });
      } catch (error) {
        console.error("Gagal mencatat log WhatsApp:", error);
        toast.error("Log pengiriman WhatsApp gagal dicatat");
      }
    }

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" type="button">
          <MessageCircle className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Kirim Notifikasi WhatsApp
          </DialogTitle>
          <DialogDescription>
            Pilih penerima dan tinjau pesan sebelum membuka WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Penerima (dari data pengguna)</Label>
            <Select
              value={selectedRecipientId}
              onValueChange={(value) => {
                setSelectedRecipientId(value);
                if (value) setCustomPhone("");
              }}
            >
              <SelectTrigger id="recipient">
                <SelectValue placeholder="Pilih penerima" />
              </SelectTrigger>
              <SelectContent>
                {recipients.length === 0 && (
                  <SelectItem value="__none__" disabled>
                    Tidak ada pengguna dengan nomor telepon
                  </SelectItem>
                )}
                {recipients.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name} ({r.phone})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customPhone">Atau nomor manual</Label>
            <Input
              id="customPhone"
              type="tel"
              placeholder="Contoh: 081234567890"
              value={customPhone}
              onChange={(e) => {
                setCustomPhone(e.target.value);
                if (e.target.value) setSelectedRecipientId("");
              }}
            />
            <p className="text-xs text-muted-foreground">
              Biarkan kosong jika memilih penerima dari daftar.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Preview Pesan</Label>
            <Textarea
              id="message"
              rows={6}
              value={message}
              readOnly
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => setOpen(false)} type="button">
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleOpenWhatsApp}
            disabled={!isPhoneValid}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Buka WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
