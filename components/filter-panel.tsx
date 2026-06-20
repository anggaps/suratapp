"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterOption {
  id: string;
  label: string;
}

interface FilterPanelProps {
  classifications: FilterOption[];
  statuses: FilterOption[];
  showDateRange?: boolean;
  showApprovalFilter?: boolean;
}

export function FilterPanel({
  classifications,
  statuses,
  showDateRange = true,
  showApprovalFilter = false,
}: FilterPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const classificationId = searchParams.get("classificationId") ?? "";
  const statusId = searchParams.get("statusId") ?? "";
  const approval = searchParams.get("approval") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const buildUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    params.delete("page");
    return `${pathname}?${params.toString()}`;
  };

  const handleChange = (key: string, value: string) => {
    router.push(buildUrl({ [key]: value }));
  };

  const handleReset = () => {
    router.push(pathname);
  };

  const hasFilter = q || classificationId || statusId || approval || from || to;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[200px] space-y-1">
        <Label htmlFor="q" className="text-xs">
          Pencarian
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="q"
            placeholder="Cari nomor agenda, nomor surat, perihal..."
            className="pl-9"
            defaultValue={q}
            onChange={(e) => handleChange("q", e.target.value)}
          />
        </div>
      </div>

      <div className="w-[180px] space-y-1">
        <Label className="text-xs">Klasifikasi</Label>
        <Select
          value={classificationId || "__all__"}
          onValueChange={(value) =>
            handleChange("classificationId", value === "__all__" ? "" : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Semua klasifikasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Semua klasifikasi</SelectItem>
            {classifications.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-[180px] space-y-1">
        <Label className="text-xs">Status Sifat</Label>
        <Select
          value={statusId || "__all__"}
          onValueChange={(value) =>
            handleChange("statusId", value === "__all__" ? "" : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Semua status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Semua status</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showApprovalFilter && (
        <div className="w-[180px] space-y-1">
          <Label className="text-xs">Status Persetujuan</Label>
          <Select
            value={approval || "__all__"}
            onValueChange={(value) =>
              handleChange("approval", value === "__all__" ? "" : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Semua persetujuan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Semua persetujuan</SelectItem>
              <SelectItem value="menunggu">Menunggu</SelectItem>
              <SelectItem value="disetujui">Disetujui</SelectItem>
              <SelectItem value="ditolak">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {showDateRange && (
        <>
          <div className="w-[150px] space-y-1">
            <Label htmlFor="from" className="text-xs">
              Dari Tanggal
            </Label>
            <Input
              id="from"
              type="date"
              value={from}
              onChange={(e) => handleChange("from", e.target.value)}
            />
          </div>
          <div className="w-[150px] space-y-1">
            <Label htmlFor="to" className="text-xs">
              Sampai Tanggal
            </Label>
            <Input
              id="to"
              type="date"
              value={to}
              onChange={(e) => handleChange("to", e.target.value)}
            />
          </div>
        </>
      )}

      {hasFilter && (
        <Button variant="ghost" size="sm" onClick={handleReset} type="button">
          <X className="mr-1 h-4 w-4" />
          Reset
        </Button>
      )}
    </div>
  );
}
