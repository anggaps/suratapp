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
import { DeleteIncomingButton } from "@/components/delete-incoming-button";
import { FilterPanel } from "@/components/filter-panel";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    classificationId?: string;
    statusId?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function IncomingLettersPage({ searchParams }: PageProps) {
  const session = await auth();
  const isPimpinan = session?.user?.role === "PIMPINAN";
  const { q, page, classificationId, statusId, from, to } = await searchParams;
  const currentPage = Number(page) || 1;
  const settings = await prisma.setting.findFirst();
  const pageSize = settings?.itemsPerPage ?? 10;
  const skip = (currentPage - 1) * pageSize;

  const conditions: Record<string, unknown>[] = [];

  if (q) {
    conditions.push({
      OR: [
        { sender: { contains: q } },
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

  if (from && isValid(parseISO(from))) {
    conditions.push({ date: { gte: startOfDay(parseISO(from)) } });
  }

  if (to && isValid(parseISO(to))) {
    conditions.push({ date: { lte: endOfDay(parseISO(to)) } });
  }

  const where = conditions.length > 0 ? { AND: conditions } : {};

  const [letters, total, classifications, statuses] = await Promise.all([
    prisma.incomingLetter.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: { classification: true, status: true, _count: { select: { dispositions: true } } },
    }),
    prisma.incomingLetter.count({ where }),
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
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("page", String(targetPage));
    return `/surat-masuk?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Surat Masuk</h1>
          <p className="text-muted-foreground">Kelola surat masuk dan disposisinya</p>
        </div>
        {!isPimpinan && (
          <Button asChild>
            <Link href="/surat-masuk/tambah">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Surat
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Daftar Surat Masuk</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterPanel
            classifications={classificationOptions}
            statuses={statusOptions}
            showDateRange={true}
          />

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Agenda</TableHead>
                  <TableHead>No. Surat</TableHead>
                  <TableHead>Pengirim</TableHead>
                  <TableHead>Perihal</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Klasifikasi</TableHead>
                  <TableHead>Disposisi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {letters.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                )}
                {letters.map((letter) => (
                  <TableRow key={letter.id}>
                    <TableCell>{letter.agendaNumber}</TableCell>
                    <TableCell>{letter.letterNumber}</TableCell>
                    <TableCell>{letter.sender}</TableCell>
                    <TableCell>{letter.subject}</TableCell>
                    <TableCell>
                      {format(new Date(letter.date), "dd MMM yyyy", { locale: id })}
                    </TableCell>
                    <TableCell>{letter.classification?.name ?? "-"}</TableCell>
                    <TableCell>
                      {letter._count.dispositions > 0 ? (
                        <Badge variant="default">Sudah Disposisi</Badge>
                      ) : (
                        <Badge variant="secondary">Belum</Badge>
                      )}
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/surat-masuk/${letter.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      {!isPimpinan && <DeleteIncomingButton id={letter.id} />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
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
