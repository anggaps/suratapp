"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { approveOutgoingLetter, rejectOutgoingLetter } from "@/lib/actions/outgoing-letter.actions";

interface OutgoingApprovalActionsProps {
  letterId: string;
  isApproved: boolean;
  rejectionReason: string | null;
}

export function OutgoingApprovalActions({ letterId, isApproved, rejectionReason }: OutgoingApprovalActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  const handleApprove = async () => {
    setLoading("approve");
    try {
      await approveOutgoingLetter(letterId);
      toast.success("Surat keluar berhasil disetujui");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Gagal menyetujui surat");
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Alasan penolakan wajib diisi");
      return;
    }

    setLoading("reject");
    const formData = new FormData();
    formData.append("reason", reason);

    try {
      const result = await rejectOutgoingLetter(letterId, formData);
      if (result && "error" in result) {
        const err = result.error as Record<string, string[]>;
        toast.error(Object.values(err).flat().join(", "));
        return;
      }
      setOpen(false);
      setReason("");
      toast.success("Surat keluar berhasil ditolak");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Gagal menolak surat");
    } finally {
      setLoading(null);
    }
  };

  if (isApproved) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
        Surat ini sudah disetujui.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Persetujuan Surat Keluar</p>
          <p className="text-sm text-muted-foreground">
            {rejectionReason ? "Surat ditolak sebelumnya. Anda dapat menyetujuinya kembali." : "Surat menunggu persetujuan."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
                <X className="mr-2 h-4 w-4" />
                Tolak
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleReject}>
                <DialogHeader>
                  <DialogTitle>Tolak Surat Keluar</DialogTitle>
                  <DialogDescription>
                    Berikan alasan penolakan agar pembuat surat dapat memperbaiki.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-4">
                  <Label htmlFor="reason">Alasan Penolakan</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading === "reject"}>
                    Batal
                  </Button>
                  <Button type="submit" variant="destructive" disabled={loading === "reject"}>
                    {loading === "reject" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menolak...
                      </>
                    ) : (
                      "Tolak"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button onClick={handleApprove} disabled={loading === "approve"}>
            {loading === "approve" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyetujui...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Setujui
              </>
            )}
          </Button>
        </div>
      </div>
      {rejectionReason && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          <span className="font-medium">Alasan penolakan sebelumnya:</span> {rejectionReason}
        </div>
      )}
    </div>
  );
}
