import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet,
  TrendingUp,
  Users,
  UserCheck,
  UserPlus,
  Clock,
  Star,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { AdminLayout } from "@/components/admin/admin-layout";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/badges";
import { AddStudentDialog } from "@/components/admin/add-student-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/services/api";
import { formatPKR, formatDate } from "@/lib/mock-data";
import { SafeChart } from "@/components/safe-chart";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Pixel2Pro Admin" }] }),
  component: DashboardPage,
});

const PIE_COLORS = ["hsl(142 72% 45%)", "hsl(45 93% 55%)", "hsl(0 84% 60%)"];

function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => api.dashboard() });
  const [addOpen, setAddOpen] = useState(false);
  const metrics = data?.metrics;
  const activities = data?.activities ?? [];
  const students = data?.students ?? [];
  const payments = data?.payments ?? [];
  const courses = data?.courses ?? [];
  const now = new Date();
  const revenueTrend = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const inMonth = payments.filter((p) => {
      const d = new Date(p.paymentDate);
      return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
    });
    return {
      month: month.toLocaleDateString("en", { month: "short" }),
      revenue: inMonth.filter((p) => p.status === "verified").reduce((sum, p) => sum + p.amount, 0),
      enrollments: students.filter((s) => {
        const d = new Date(s.enrollmentDate);
        return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
      }).length,
    };
  });
  const paymentStatusData = ["verified", "pending", "rejected"].map((name) => ({
    name: name[0].toUpperCase() + name.slice(1),
    value: payments.filter((p) => p.status === name).length,
  }));
  const courseWiseStudents = courses.map((c) => ({
    name: c.courseName.split(" ").slice(0, 2).join(" "),
    students: students.filter((s) => s.courseId === c.id || s.courseName === c.courseName).length,
  }));

  const latestEnrollments = [...students]
    .sort((a, b) => +new Date(b.enrollmentDate) - +new Date(a.enrollmentDate))
    .slice(0, 5);
  const latestPayments = [...payments].slice(0, 5);
  const pendingList = students.filter((s) => s.admissionStatus === "pending").slice(0, 5);

  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthRevenue = payments
    .filter((p) => {
      if (p.status !== "verified") return false;
      const pd = new Date(p.paymentDate);
      return pd.getMonth() === lastMonth.getMonth() && pd.getFullYear() === lastMonth.getFullYear();
    })
    .reduce((sum, p) => sum + p.amount, 0);
  const revenueTrendPct =
    prevMonthRevenue > 0
      ? ((((metrics?.monthlyRevenue ?? 0) - prevMonthRevenue) / prevMonthRevenue) * 100).toFixed(1)
      : "0";
  const prevMonthStudents = students.filter((s) => {
    const sd = new Date(s.enrollmentDate);
    return sd.getMonth() === lastMonth.getMonth() && sd.getFullYear() === lastMonth.getFullYear();
  }).length;
  const studentTrendPct =
    prevMonthStudents > 0
      ? ((((metrics?.totalStudents ?? 0) - prevMonthStudents) / prevMonthStudents) * 100).toFixed(1)
      : "0";

  return (
    <AdminLayout title="Dashboard" subtitle="A snapshot of your bootcamp — updated in real time.">
      <div className="mb-4 flex items-center justify-end">
        <Button size="sm" onClick={() => setAddOpen(true)} className="w-full sm:w-auto">
          <UserPlus className="mr-1.5 h-4 w-4" /> Add Student
        </Button>
      </div>
      <AddStudentDialog open={addOpen} onClose={() => setAddOpen(false)} courses={courses} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {isLoading || !metrics ? (
          Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <StatCard
              label="Total Revenue"
              value={formatPKR(metrics.totalRevenue)}
              icon={Wallet}
              trend={{ value: `${revenueTrendPct}%`, up: Number(revenueTrendPct) >= 0 }}
              hint="vs last month"
              tone="success"
            />
            <StatCard
              label="Monthly Revenue"
              value={formatPKR(metrics.monthlyRevenue)}
              icon={TrendingUp}
              hint="this month"
              tone="success"
            />
            <StatCard
              label="Total Students"
              value={metrics.totalStudents}
              icon={Users}
              tone="info"
              hint="all cohorts"
            />
            <StatCard
              label="Active Students"
              value={metrics.activeStudents}
              icon={UserCheck}
              tone="info"
            />
            <StatCard
              label="Pending Admissions"
              value={metrics.pendingAdmissions}
              icon={UserPlus}
              tone="warning"
            />
            <StatCard
              label="Pending Payments"
              value={metrics.pendingPayments}
              icon={Clock}
              tone="warning"
            />
            <StatCard
              label="New Enrollments Today"
              value={metrics.newEnrollmentsToday}
              icon={UserPlus}
              tone="info"
            />
            <StatCard
              label="Approved Reviews"
              value={metrics.approvedReviews}
              icon={CheckCircle2}
              tone="success"
            />
            <StatCard
              label="Pending Reviews"
              value={metrics.pendingReviews}
              icon={Star}
              tone="warning"
            />
          </>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue and enrollments across the year.</CardDescription>
            </div>
            <Badge variant="secondary" className="rounded-full">
              Last 12 months
            </Badge>
          </CardHeader>
          <CardContent className="h-56 sm:h-64 lg:h-72">
            <SafeChart>
              <ResponsiveContainer>
                <AreaChart data={revenueTrend}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="hsl(var(--border))"
                    strokeDasharray="4 4"
                    vertical={false}
                  />
                  <XAxis dataKey="month" stroke="currentColor" opacity={0.5} fontSize={11} />
                  <YAxis
                    stroke="currentColor"
                    opacity={0.5}
                    fontSize={11}
                    tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      borderRadius: 10,
                      border: "1px solid hsl(var(--border))",
                    }}
                    formatter={(v: number) => formatPKR(v)}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="currentColor"
                    strokeWidth={2}
                    fill="url(#rev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </SafeChart>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
            <CardDescription>Verification split.</CardDescription>
          </CardHeader>
          <CardContent className="h-56 sm:h-64 lg:h-72">
            <SafeChart>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={paymentStatusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {paymentStatusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      borderRadius: 10,
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </SafeChart>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Monthly Admissions</CardTitle>
            <CardDescription>New enrollments per month.</CardDescription>
          </CardHeader>
          <CardContent className="h-48 sm:h-56 lg:h-64">
            <SafeChart>
              <ResponsiveContainer>
                <BarChart data={revenueTrend}>
                  <CartesianGrid
                    stroke="hsl(var(--border))"
                    strokeDasharray="4 4"
                    vertical={false}
                  />
                  <XAxis dataKey="month" stroke="currentColor" opacity={0.5} fontSize={11} />
                  <YAxis stroke="currentColor" opacity={0.5} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      borderRadius: 10,
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Bar dataKey="enrollments" fill="currentColor" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </SafeChart>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Course-wise Students</CardTitle>
            <CardDescription>Enrollment distribution.</CardDescription>
          </CardHeader>
          <CardContent className="h-48 sm:h-56 lg:h-64">
            <SafeChart>
              <ResponsiveContainer>
                <BarChart data={courseWiseStudents} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid
                    stroke="hsl(var(--border))"
                    strokeDasharray="4 4"
                    horizontal={false}
                  />
                  <XAxis type="number" stroke="currentColor" opacity={0.5} fontSize={11} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={90}
                    stroke="currentColor"
                    opacity={0.7}
                    fontSize={11}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      borderRadius: 10,
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Bar dataKey="students" fill="currentColor" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </SafeChart>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="rounded-2xl xl:col-span-2">
          <CardHeader>
            <CardTitle>Latest Enrollments</CardTitle>
            <CardDescription>The newest students in your pipeline.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="divide-y divide-border">
              {latestEnrollments.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-6 py-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={s.avatar} />
                    <AvatarFallback>{s.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{s.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {s.courseName} · {s.city}
                    </div>
                  </div>
                  <StatusBadge status={s.admissionStatus} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Live feed.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-4 border-l border-border pl-4">
              {activities.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[21px] top-1 grid h-3 w-3 place-items-center rounded-full bg-primary ring-4 ring-background" />
                  <p className="text-sm font-medium">{a.message}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Latest Payments</CardTitle>
            <CardDescription>Recent transactions across methods.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="divide-y divide-border">
              {latestPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 px-6 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{p.studentName}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {p.paymentMethod} · {p.transactionId}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{formatPKR(p.amount)}</div>
                    <PaymentBadge status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" /> Pending Verification
            </CardTitle>
            <CardDescription>Admissions waiting for review.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="divide-y divide-border">
              {pendingList.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-6 py-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={s.avatar} />
                    <AvatarFallback>{s.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{s.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{s.courseName}</div>
                  </div>
                  <Badge variant="outline" className="rounded-full">
                    Review
                  </Badge>
                </div>
              ))}
              {pendingList.length === 0 && (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                  Nothing pending — you're all caught up 🎉
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    verified: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    rejected: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  };
  return (
    <span
      className={`mt-0.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${map[status] ?? ""}`}
    >
      {status}
    </span>
  );
}
