import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO, startOfDay, endOfDay, isValid } from "date-fns";
import { id } from "date-fns/locale";
import { auth } from "@/auth";
import { Plus, Eye } from "lucide-react";
import { DeleteOutgoingButton } from "@/components/delete-outgoing-button";
import { FilterPanel } from "@/components/filter-panel";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    classificationId?: string;
    statusId?: string;
    approval?: "menunggu" | "disetujui" | "ditolak";
    from?: string;
    to?: string;
  }>;
}

function getApprovalStatus(letter: {
  approvedById: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
}) {
  if (letter.approvedById) return { label: "Disetujui", variant: "default" as const, color: "bg-green-100 text-green-800" };
  if (letter.rejectionReason) return { label: "Ditolak", variant: "destructive" as const, color: "bg-red-100 text-red-800" };
  return { label: "Menunggu", variant: "secondary" as const, color: "bg-yellow-100 text-yellow-800" };
}

export default async function OutgoingLettersPage({ searchParams }: PageProps) {
  const session = await auth();
  const role = session?.user?.role;
  const isPimpinan = role === "PIMPINAN";
  const isStaff = role === "STAFF";
  const { q, page, classificationId, statusId, approval, from, to } = await searchParams;
  const currentPage = Number(page) || 1;
  const settings = await prisma.setting.findFirst();
  const pageSize = settings?.itemsPerPage ?? 10;
  const skip = (currentPage - 1) * pageSize;

  const conditions: Record<string, unknown>[] = [];

  if (q) {
    conditions.push({
      OR: [
        { recipient: { contains: q } },
        { letterNumber: { contains: q } },
        { agendaNumber: { contains: q } },
        { subject: { contains: q } },
      ],
    });
  }

  if (classificationId) {
    conditions.push({ classificationId });
  }

  if (statusId) {
    conditions.push({ statusId });
  }

  if (approval === "menunggu") {
    conditions.push({ approvedById: null, rejectionReason: null });
  } else if (approval === "disetujui") {
    conditions.push({ approvedById: { not: null } });
  } else if (approval === "ditolak") {
    conditions.push({ rejectionReason: { not: null }, approvedById: null });
  }

  if (from && isValid(parseISO(from))) {
    conditions.push({ date: { gte: startOfDay(parseISO(from)) } });
  }

  if (to && isValid(parseISO(to))) {
    conditions.push({ date: { lte: endOfDay(parseISO(to)) } });
  }

  const where = conditions.length > 0 ? { AND: conditions } : {};

  const [letters, total, classifications, statuses] = await Promise.all([
    prisma.outgoingLetter.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: { classification: true, status: true },
    }),
    prisma.outgoingLetter.count({ where }),
    prisma.classification.findMany({ orderBy: { name: "asc" } }),
    prisma.letterStatus.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  const classificationOptions = classifications.map((c) => ({
    id: c.id,
    label: `${c.code} - ${c.name}`,
  }));

  const statusOptions = statuses.map((s) => ({
    id: s.id,
    label: s.name,
  }));

  const buildPageLink = (targetPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (classificationId) params.set("classificationId", classificationId);
    if (statusId) params.set("statusId", statusId);
    if (approval) params.set("approval", approval);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("page", String(targetPage));
    return `/surat-keluar?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Surat Keluar</h1>
          <p className="text-muted-foreground">Kelola surat keluar</p>
        </div>
        {!isPimpinan && (
          <Button asChild>
            <Link href="/surat-keluar/tambah">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Surat
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Daftar Surat Keluar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterPanel
            classifications={classificationOptions}
            statuses={statusOptions}
            showDateRange={true}
            showApprovalFilter={true}
          />

          <div className="overflow-x-auto rounded-md border">
            <Table className="responsive-table">
              <TableHeader>
                <TableRow>
                  <TableHead>No. Agenda</TableHead>
                  <TableHead>No. Surat</TableHead>
                  <TableHead>Penerima</TableHead>
                  <TableHead>Perihal</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Klasifikasi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {letters.length === 0 && (
                  <TableRow>
                    <TableCell data-label="" colSpan={8} className="text-center text-muted-foreground">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                )}
                {letters.map((letter) => {
                  const approval = getApprovalStatus(letter);
                  const canEditDelete = !isPimpinan && !(isStaff && letter.approvedById);
                  return (
                    <TableRow key={letter.id}>
                      <TableCell data-label="No. Agenda">{letter.agendaNumber}</TableCell>
                      <TableCell data-label="No. Surat">{letter.letterNumber}</TableCell>
                      <TableCell data-label="Penerima">{letter.recipient}</TableCell>
                      <TableCell data-label="Perihal">{letter.subject}</TableCell>
                      <TableCell data-label="Tanggal">
                        {format(new Date(letter.date), "dd MMM yyyy", { locale: id })}
                      </TableCell>
                      <TableCell data-label="Klasifikasi">{letter.classification?.name ?? "-"}</TableCell>
                      <TableCell data-label="Status">
                        <Badge className={approval.color}>{approval.label}</Badge>
                      </TableCell>
                      <TableCell data-label="Aksi">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/surat-keluar/${letter.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {canEditDelete && <DeleteOutgoingButton id={letter.id} />}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Halaman {currentPage} dari {totalPages} · Total {total} data
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                asChild
              >
                <Link href={buildPageLink(currentPage - 1)}>Sebelumnya</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                asChild
              >
                <Link href={buildPageLink(currentPage + 1)}>Selanjutnya</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
