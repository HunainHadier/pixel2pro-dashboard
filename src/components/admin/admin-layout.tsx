import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Star,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  Moon,
  Sun,
  Menu,
  X,
  Command as CommandIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { clearSession, useSession } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { api } from "@/services/api";
import { formatPKR } from "@/lib/mock-data";
import { toast } from "sonner";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/students", label: "Students", icon: Users },
  { to: "/payments", label: "Payments", icon: Wallet },
  { to: "/reviews", label: "Reviews", icon: Star },
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/logo.png" alt="Pixel2Pro" className="h-9 w-9 shrink-0 rounded-xl bg-white object-contain p-1 shadow-sm" />
      <div className="min-w-0 leading-tight">
        <div className="truncate font-black tracking-tight">PIXEL2PRO</div>
        <div className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">Admin Portal</div>
      </div>
    </div>
  );
}

function NotificationsBell() {
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => api.dashboard(), refetchInterval: 30000 });
  const students = data?.students ?? [];
  const payments = data?.payments ?? [];
  const reviews = data?.reviews ?? [];

  const admissions = students.filter((s) => s.admissionStatus === "pending");
  const pending = payments.filter((p) => p.status === "pending");
  const pendingReviews = reviews.filter((r) => r.status === "pending");
  const count = admissions.length + pending.length + pendingReviews.length;

  const items = [
    ...admissions.map((s) => ({
      key: `adm-${s.id}`,
      href: "/students" as const,
      title: "New admission pending",
      detail: `${s.name} — ${s.courseName}`,
    })),
    ...pending.map((p) => ({
      key: `pay-${p.id}`,
      href: "/payments" as const,
      title: "Payment awaiting verification",
      detail: `${formatPKR(p.amount)} — ${p.studentName}`,
    })),
    ...pendingReviews.map((r) => ({
      key: `rev-${r.id}`,
      href: "/reviews" as const,
      title: `New ${r.rating}★ review`,
      detail: r.courseName,
    })),
  ].slice(0, 8);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative shrink-0">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <Badge className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full p-0 px-1 text-[10px]">{count}</Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">You're all caught up.</div>
        ) : items.map((item) => (
          <DropdownMenuItem asChild key={item.key} className="flex-col items-start gap-0.5">
            <Link to={item.href}>
              <span className="text-sm font-medium">{item.title}</span>
              <span className="text-xs text-muted-foreground">{item.detail}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        {count > items.length && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-xs text-muted-foreground">
              {count - items.length} more…
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AdminLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const pathname = useRouterState({ select: s => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const { session } = useSession();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const doLogout = () => {
    clearSession();
    toast.success("Signed out");
    navigate({ to: "/auth" });
  };

  const SidebarInner = (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        <div className="px-2 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Overview
        </div>
        {nav.map(item => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "" : "text-muted-foreground group-hover:text-foreground")} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={doLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <div className="hidden lg:block sticky top-0 h-screen">{SidebarInner}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 h-full">{SidebarInner}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-md sm:h-16 sm:px-4 sm:gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-bold tracking-tight sm:text-lg">{title}</h1>
            </div>
            {subtitle && <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>}
          </div>

          <div className="hidden items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground md:flex md:w-48 lg:w-72">
            <Search className="h-4 w-4 shrink-0" />
            <input
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
              placeholder="Search…"
            />
            <kbd className="hidden shrink-0 items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground lg:inline-flex">
              <CommandIcon className="h-3 w-3" /> K
            </kbd>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <NotificationsBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full p-1 pr-2 transition-colors hover:bg-muted shrink-0">
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                    <AvatarImage src={session?.avatar} />
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left sm:block">
                    <div className="text-xs font-semibold leading-tight">{session?.name ?? "Admin"}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{session?.role.replace("_", " ") ?? "admin"}</div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="truncate">{session?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/settings">Profile & Settings</Link></DropdownMenuItem>
                <DropdownMenuItem onSelect={doLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-3 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}