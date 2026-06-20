import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, startOfDay, endOfDay, isValid } from "date-fns";
import { id } from "date-fns/locale";
import { PrintButton } from "@/components/print-button";
import { FilterPanel } from "@/components/filter-panel";

interface PageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
    q?: string;
    classificationId?: string;
    statusId?: string;
  }>;
}

export default async function AgendaPage({ searchParams }: PageProps) {
  const { from, to, q, classificationId, statusId } = await searchParams;
  const fromDate = from && isValid(parseISO(from)) ? parseISO(from) : new Date();
  const toDate = to && isValid(parseISO(to)) ? parseISO(to) : new Date();

  const baseIncomingConditions: Record<string, unknown>[] = [
    {
      date: {
        gte: startOfDay(fromDate),
        lte: endOfDay(toDate),
      },
    },
  ];

  const baseOutgoingConditions: Record<string, unknown>[] = [
    {
      date: {
        gte: startOfDay(fromDate),
        lte: endOfDay(toDate),
      },
    },
  ];

  if (q) {
    baseIncomingConditions.push({
      OR: [
        { sender: { contains: q } },
        { letterNumber: { contains: q } },
        { agendaNumber: { contains: q } },
        { subject: { contains: q } },
      ],
    });
    baseOutgoingConditions.push({
      OR: [
        { recipient: { contains: q } },
        { letterNumber: { contains: q } },
        { agendaNumber: { contains: q } },
        { subject: { contains: q } },
      ],
    });
  }

  if (classificationId) {
    baseIncomingConditions.push({ classificationId });
    baseOutgoingConditions.push({ classificationId });
  }

  if (statusId) {
    baseIncomingConditions.push({ statusId });
    baseOutgoingConditions.push({ statusId });
  }

  const whereIncoming =
    baseIncomingConditions.length > 1
      ? { AND: baseIncomingConditions }
      : baseIncomingConditions[0];
  const whereOutgoing =
    baseOutgoingConditions.length > 1
      ? { AND: baseOutgoingConditions }
      : baseOutgoingConditions[0];

  const [incoming, outgoing, classifications, statuses] = await Promise.all([
    prisma.incomingLetter.findMany({
      where: whereIncoming,
      orderBy: { date: "asc" },
      include: { classification: true, status: true },
    }),
    prisma.outgoingLetter.findMany({
      where: whereOutgoing,
      orderBy: { date: "asc" },
      include: { classification: true, status: true },
    }),
    prisma.classification.findMany({ orderBy: { name: "asc" } }),
    prisma.letterStatus.findMany({ orderBy: { name: "asc" } }),
  ]);

  const classificationOptions = classifications.map((c) => ({
    id: c.id,
    label: `${c.code} - ${c.name}`,
  }));

  const statusOptions = statuses.map((s) => ({
    id: s.id,
    label: s.name,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agenda Surat</h1>
          <p className="text-muted-foreground">Cari dan cetak agenda surat berdasarkan tanggal</p>
        </div>
        <div className="hidden print:hidden md:block">
          <PrintButton />
        </div>
      </div>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Filter Tanggal & Kriteria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="flex flex-wrap items-end gap-4" method="GET">
            <div className="space-y-2">
              <Label htmlFor="from">Dari Tanggal</Label>
              <Input
                id="from"
                name="from"
                type="date"
                defaultValue={format(fromDate, "yyyy-MM-dd")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">Sampai Tanggal</Label>
              <Input
                id="to"
                name="to"
                type="date"
                defaultValue={format(toDate, "yyyy-MM-dd")}
              />
            </div>
            <Button type="submit">Tampilkan</Button>
          </form>

          <FilterPanel
            classifications={classificationOptions}
            statuses={statusOptions}
            showDateRange={false}
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="masuk" className="w-full">
        <TabsList className="print:hidden">
          <TabsTrigger value="masuk">Surat Masuk ({incoming.length})</TabsTrigger>
          <TabsTrigger value="keluar">Surat Keluar ({outgoing.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="masuk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agenda Surat Masuk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table className="responsive-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Agenda</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>No. Surat</TableHead>
                      <TableHead>Pengirim</TableHead>
                      <TableHead>Perihal</TableHead>
                      <TableHead>Klasifikasi</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incoming.length === 0 && (
                      <TableRow>
                        <TableCell data-label="" colSpan={7} className="text-center text-muted-foreground">
                          Tidak ada data
                        </TableCell>
                      </TableRow>
                    )}
                    {incoming.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell data-label="No. Agenda">{item.agendaNumber}</TableCell>
                        <TableCell data-label="Tanggal">
                          {format(new Date(item.date), "dd MMM yyyy", { locale: id })}
                        </TableCell>
                        <TableCell data-label="No. Surat">{item.letterNumber}</TableCell>
                        <TableCell data-label="Pengirim">{item.sender}</TableCell>
                        <TableCell data-label="Perihal">{item.subject}</TableCell>
                        <TableCell data-label="Klasifikasi">{item.classification?.name ?? "-"}</TableCell>
                        <TableCell data-label="Status">{item.status?.name ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keluar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agenda Surat Keluar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table className="responsive-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Agenda</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>No. Surat</TableHead>
                      <TableHead>Penerima</TableHead>
                      <TableHead>Perihal</TableHead>
                      <TableHead>Klasifikasi</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outgoing.length === 0 && (
                      <TableRow>
                        <TableCell data-label="" colSpan={7} className="text-center text-muted-foreground">
                          Tidak ada data
                        </TableCell>
                      </TableRow>
                    )}
                    {outgoing.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell data-label="No. Agenda">{item.agendaNumber}</TableCell>
                        <TableCell data-label="Tanggal">
                          {format(new Date(item.date), "dd MMM yyyy", { locale: id })}
                        </TableCell>
                        <TableCell data-label="No. Surat">{item.letterNumber}</TableCell>
                        <TableCell data-label="Penerima">{item.recipient}</TableCell>
                        <TableCell data-label="Perihal">{item.subject}</TableCell>
                        <TableCell data-label="Klasifikasi">{item.classification?.name ?? "-"}</TableCell>
                        <TableCell data-label="Status">{item.status?.name ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
