"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MailOpen,
  Send,
  CalendarDays,
  Image,
  FolderTree,
  Users,
  Settings,
  UserCircle,
  ChevronDown,
  ClipboardList,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SidebarProps {
  role: string;
  appName: string;
  institutionName?: string;
  logo?: string | null;
  variant?: "sidebar" | "drawer";
  onNavigate?: () => void;
}

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/surat-masuk", label: "Surat Masuk", icon: MailOpen },
  { href: "/surat-keluar", label: "Surat Keluar", icon: Send },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/galeri", label: "Galeri", icon: Image },
];

export function Sidebar({
  role,
  appName,
  institutionName,
  logo,
  variant = "sidebar",
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = role === "ADMIN";
  const isStaff = role === "STAFF";

  const isDrawer = variant === "drawer";

  return (
    <aside
      className={cn(
        "flex w-64 flex-col bg-background",
        isDrawer ? "h-full" : "hidden border-r lg:flex",
      )}
      onClick={(e) => {
        if (onNavigate && (e.target as Element).closest("a")) onNavigate();
      }}
    >
      <div className="flex h-16 items-center gap-2 border-b px-4">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt={appName}
            className="h-9 w-9 shrink-0 rounded-md object-cover"
          />
        ) : (
          <MailOpen className="h-6 w-6 shrink-0 text-primary" />
        )}
        <Link href="/dashboard" className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">{appName}</span>
          {institutionName && (
            <span className="truncate text-xs text-muted-foreground">
              {institutionName}
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
        <Collapsible defaultOpen={pathname.startsWith("/referensi")}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <span className="flex items-center gap-3">
                <FolderTree className="h-4 w-4" />
                Referensi
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 pl-4">
            <Link
              href="/referensi/klasifikasi"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                pathname === "/referensi/klasifikasi"
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              Klasifikasi Surat
            </Link>
            <Link
              href="/referensi/status-surat"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                pathname === "/referensi/status-surat"
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              Status Sifat Surat
            </Link>
          </CollapsibleContent>
        </Collapsible>
        )}

        {isAdmin && (
          <>
            <Link
              href="/pengguna"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === "/pengguna" || pathname.startsWith("/pengguna/")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Users className="h-4 w-4" />
              Pengguna
            </Link>

            <Link
              href="/pengaturan"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === "/pengaturan"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Settings className="h-4 w-4" />
              Pengaturan Sistem
            </Link>
          </>
        )}

        {isAdmin && (
          <Link
            href="/audit-log"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/audit-log"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <ClipboardList className="h-4 w-4" />
            Audit Log
          </Link>
        )}

        <Link
          href="/profil"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/profil"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <UserCircle className="h-4 w-4" />
          Profil
        </Link>
      </nav>
    </aside>
  );
}
