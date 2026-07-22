import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, FileSpreadsheet, FileDown, Calendar } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line } from "recharts";
import { formatPKR } from "@/lib/mock-data";
import { api } from "@/services/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Reports — Pixel2Pro Admin" }] }),
  component: ReportsPage,
});

const reports = [
  { id: "revenue", title: "Revenue Report", desc: "Verified income across cohorts and methods." },
  { id: "admission", title: "Admission Report", desc: "Applications, confirmations, and rejections over time." },
  { id: "course", title: "Course Performance", desc: "Enrollment, revenue, and completion by course." },
  { id: "student", title: "Student Performance", desc: "Attendance, grades, and outcomes." },
  { id: "payment", title: "Payment Report", desc: "Transactions by method and status." },
  { id: "review", title: "Review Report", desc: "Ratings, sentiment, and moderation." },
];

function ReportsPage() {
  const [from, setFrom] = useState("2026-01-01");
  const [to, setTo] = useState("2026-12-31");

  const { data: dashboardData } = useQuery({ queryKey: ["dashboard"], queryFn: () => api.dashboard() });
  const students = dashboardData?.students ?? [];
  const payments = dashboardData?.payments ?? [];
  const courses = dashboardData?.courses ?? [];

  const now = new Date();

  const revenueTrend = useMemo(() => {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthPayments = payments.filter(p => {
        if (p.status !== "verified") return false;
        const pd = new Date(p.paymentDate);
        return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
      });
      months.push({
        month: d.toLocaleDateString("en", { month: "short" }),
        revenue: monthPayments.reduce((sum, p) => sum + p.amount, 0),
        enrollments: students.filter(s => {
          const sd = new Date(s.enrollmentDate);
          return sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear();
        }).length,
      });
    }
    return months;
  }, [payments, students, now]);

  const courseWiseStudents = useMemo(() => courses.map(c => ({
    name: c.courseName.split(" ").slice(0, 2).join(" "),
    students: students.filter(s => s.courseId === c.id || s.courseName === c.courseName).length,
  })), [courses, students]);

  const filteredRevenueTrend = useMemo(() => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    return revenueTrend.filter((_, i) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      return monthDate >= fromDate && monthDate <= toDate;
    });
  }, [revenueTrend, from, to, now]);

  const exportReport = (type: string, reportTitle: string) => {
    let csv = "";
    if (reportTitle === "Revenue Report") {
      const headers = ["Month", "Revenue"];
      const rows = filteredRevenueTrend.map(r => [r.month, String(r.revenue)]);
      csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    } else if (reportTitle === "Course Performance") {
      const headers = ["Course", "Students"];
      const rows = courseWiseStudents.map(r => [r.name, String(r.students)]);
      csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    } else {
      const headers = ["Name", "Email", "Course", "Status", "Enrolled"];
      const rows = students.map(s => [s.name, s.email, s.courseName, s.admissionStatus, s.enrollmentDate]);
      csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportTitle.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${reportTitle} exported to ${type}`);
  };

  return (
    <AdminLayout title="Reports" subtitle="Generate and export operational reports on demand.">
      <Card className="rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">From</label>
            <div className="relative"><Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="pl-9" /></div>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">To</label>
            <div className="relative"><Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="date" value={to} onChange={e => setTo(e.target.value)} className="pl-9" /></div>
          </div>
          <Button onClick={() => toast.success("Date range applied")} className="sm:mb-0"><Download className="mr-1.5 h-4 w-4" /> Apply</Button>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader><CardTitle>Revenue by Month</CardTitle><CardDescription>Range: {from} → {to}</CardDescription></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <BarChart data={filteredRevenueTrend}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" stroke="currentColor" opacity={0.5} fontSize={11} />
                <YAxis stroke="currentColor" opacity={0.5} fontSize={11} tickFormatter={v => `${(v / 100000).toFixed(0)}L`} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", borderRadius: 10, border: "1px solid hsl(var(--border))" }} formatter={(v: number) => formatPKR(v)} />
                <Bar dataKey="revenue" fill="currentColor" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader><CardTitle>Enrollments Trend</CardTitle><CardDescription>Growth trajectory.</CardDescription></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <LineChart data={filteredRevenueTrend}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" stroke="currentColor" opacity={0.5} fontSize={11} />
                <YAxis stroke="currentColor" opacity={0.5} fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", borderRadius: 10, border: "1px solid hsl(var(--border))" }} />
                <Line type="monotone" dataKey="enrollments" stroke="currentColor" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map(r => (
          <Card key={r.id} className="rounded-2xl">
            <CardHeader><CardTitle className="text-base">{r.title}</CardTitle><CardDescription>{r.desc}</CardDescription></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => exportReport("PDF", r.title)}><FileText className="mr-1 h-3.5 w-3.5" /> PDF</Button>
              <Button size="sm" variant="outline" onClick={() => exportReport("Excel", r.title)}><FileSpreadsheet className="mr-1 h-3.5 w-3.5" /> Excel</Button>
              <Button size="sm" variant="outline" onClick={() => exportReport("CSV", r.title)}><FileDown className="mr-1 h-3.5 w-3.5" /> CSV</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6 rounded-2xl">
        <CardHeader><CardTitle>Course Performance Snapshot</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer>
            <BarChart data={courseWiseStudents} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 4" horizontal={false} />
              <XAxis type="number" stroke="currentColor" opacity={0.5} fontSize={11} />
              <YAxis type="category" dataKey="name" width={90} stroke="currentColor" opacity={0.7} fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", borderRadius: 10, border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="students" fill="currentColor" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
