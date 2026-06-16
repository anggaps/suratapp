import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startOfDay, endOfDay, subDays, format } from "date-fns";
import { id } from "date-fns/locale";
import { MailOpen, Send, FileText, Users, TrendingUp, TrendingDown, History } from "lucide-react";
import { DashboardChart } from "@/components/dashboard-chart";
import { getRecentAuditLogs } from "@/lib/actions/audit.actions";
import { AuditLogList } from "@/components/audit-log-list";

async function getDashboardData() {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const yesterdayStart = startOfDay(subDays(new Date(), 1));
  const yesterdayEnd = endOfDay(subDays(new Date(), 1));
  const last7DaysStart = startOfDay(subDays(new Date(), 6));

  const [
    incomingToday,
    incomingYesterday,
    outgoingToday,
    outgoingYesterday,
    dispositionToday,
    outgoingPending,
    outgoingApprovedToday,
    activeUsers,
    last7Incoming,
    last7Outgoing,
    recentIncoming,
    recentOutgoing,
    recentDispositions,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.incomingLetter.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
    prisma.incomingLetter.count({ where: { createdAt: { gte: yesterdayStart, lte: yesterdayEnd } } }),
    prisma.outgoingLetter.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
    prisma.outgoingLetter.count({ where: { createdAt: { gte: yesterdayStart, lte: yesterdayEnd } } }),
    prisma.incomingDisposition.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
    prisma.outgoingLetter.count({ where: { approvedById: null } }),
    prisma.outgoingLetter.count({ where: { approvedAt: { gte: todayStart, lte: todayEnd } } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.incomingLetter.findMany({
      where: { createdAt: { gte: last7DaysStart, lte: todayEnd } },
      select: { createdAt: true },
    }),
    prisma.outgoingLetter.findMany({
      where: { createdAt: { gte: last7DaysStart, lte: todayEnd } },
      select: { createdAt: true },
    }),
    prisma.incomingLetter.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { classification: true },
    }),
    prisma.outgoingLetter.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { classification: true },
    }),
    prisma.incomingDisposition.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { incomingLetter: true, creator: true },
    }),
    getRecentAuditLogs(10),
  ]);

  const transactionToday = incomingToday + outgoingToday;
  const transactionYesterday = incomingYesterday + outgoingYesterday;

  const calcPercent = (today: number, yesterday: number) => {
    if (yesterday === 0) return today > 0 ? 100 : 0;
    return Math.round(((today - yesterday) / yesterday) * 100);
  };

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const dayStart = startOfDay(subDays(new Date(), 6 - i));
    const dayEnd = endOfDay(dayStart);
    const label = format(dayStart, "EEE", { locale: id });
    return {
      date: label,
      incoming: last7Incoming.filter((l) => l.createdAt >= dayStart && l.createdAt <= dayEnd).length,
      outgoing: last7Outgoing.filter((l) => l.createdAt >= dayStart && l.createdAt <= dayEnd).length,
    };
  });

  return {
    incomingToday,
    outgoingToday,
    dispositionToday,
    transactionToday,
    activeUsers,
    incomingPercent: calcPercent(incomingToday, incomingYesterday),
    outgoingPercent: calcPercent(outgoingToday, outgoingYesterday),
    transactionPercent: calcPercent(transactionToday, transactionYesterday),
    outgoingPending,
    outgoingApprovedToday,
    chartData,
    recentIncoming,
    recentOutgoing,
    recentDispositions,
    recentAuditLogs,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const data = await getDashboardData();

  const isPimpinan = session?.user?.role === "PIMPINAN";

  const stats = isPimpinan
    ? [
        {
          title: "Menunggu Persetujuan",
          value: data.outgoingPending,
          icon: Send,
        },
        {
          title: "Disetujui Hari Ini",
          value: data.outgoingApprovedToday,
          icon: FileText,
        },
        {
          title: "Disposisi Hari Ini",
          value: data.dispositionToday,
          icon: FileText,
        },
        {
          title: "Pengguna Aktif",
          value: data.activeUsers,
          icon: Users,
        },
      ]
    : [
        {
          title: "Surat Masuk Hari Ini",
          value: data.incomingToday,
          icon: MailOpen,
          percent: data.incomingPercent,
        },
        {
          title: "Surat Keluar Hari Ini",
          value: data.outgoingToday,
          icon: Send,
          percent: data.outgoingPercent,
        },
        {
          title: "Disposisi Hari Ini",
          value: data.dispositionToday,
          icon: FileText,
        },
        {
          title: "Transaksi Surat Hari Ini",
          value: data.transactionToday,
          icon: FileText,
          percent: data.transactionPercent,
        },
        {
          title: "Pengguna Aktif",
          value: data.activeUsers,
          icon: Users,
        },
      ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang, {session?.user?.name}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.percent && stat.percent >= 0;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.percent !== undefined && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    {isPositive ? (
                      <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                    )}
                    {Math.abs(stat.percent)}% dibanding kemarin
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader>
            <CardTitle>Statistik 7 Hari Terakhir</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <DashboardChart data={data.chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Disposisi Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentDispositions.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada disposisi</p>
            )}
            {data.recentDispositions.map((d) => (
              <div key={d.id} className="border-b pb-2 last:border-0">
                <p className="text-sm font-medium">{d.incomingLetter.subject}</p>
                <p className="text-xs text-muted-foreground">
                  Disposisi ke {d.target} · {d.creator.name}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Surat Masuk Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentIncoming.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada surat masuk</p>
            )}
            {data.recentIncoming.map((item) => (
              <div key={item.id} className="border-b pb-2 last:border-0">
                <p className="text-sm font-medium">{item.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {item.sender} · {item.classification?.name ?? "-"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentAuditLogs.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada aktivitas</p>
            )}
            {data.recentAuditLogs.map((log) => (
              <div key={log.id} className="border-b pb-2 last:border-0">
                <p className="text-sm font-medium">
                  {log.action === "CREATE" && "Dibuat"}
                  {log.action === "UPDATE" && "Diperbarui"}
                  {log.action === "DELETE" && "Dihapus"} {" "}
                  {log.entityType === "IncomingLetter" && "Surat Masuk"}
                  {log.entityType === "OutgoingLetter" && "Surat Keluar"}
                  {log.entityType === "IncomingDisposition" && "Disposisi"}
                  {log.entityType === "Attachment" && "Lampiran"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {log.performer.name} · {format(new Date(log.createdAt), "dd MMM yyyy HH:mm", { locale: id })}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
