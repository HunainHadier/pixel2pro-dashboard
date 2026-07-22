import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, MoreHorizontal, CheckCircle2, XCircle, FileText, Eye, Download, Plus, RotateCcw } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { StatusBadge } from "@/components/admin/badges";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Wallet, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { api } from "@/services/api";
import { formatPKR, formatDate, type Payment, type Student } from "@/lib/mock-data";
import { generatePaymentSlip } from "@/lib/payment-slip";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({ meta: [{ title: "Payments — Pixel2Pro Admin" }] }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const qc = useQueryClient();
  const { data, isLoading, refetch } = useQuery({ queryKey: ["payments"], queryFn: () => api.payments.list() });
  const { data: students } = useQuery({ queryKey: ["students"], queryFn: () => api.enrollments.list() });
  const [q, setQ] = useState("");
  const [method, setMethod] = useState("all");
  const [status, setStatus] = useState("all");
  const [preview, setPreview] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const list = data ?? [];
  const filtered = useMemo(() => list.filter(p => {
    const mq = !q || [p.studentName, p.courseName, p.transactionId].some(v => v.toLowerCase().includes(q.toLowerCase()));
    return mq && (method === "all" || p.paymentMethod === method) && (status === "all" || p.status === status);
  }), [list, q, method, status]);

  const revenue = list.filter(p => p.status === "verified").reduce((a, b) => a + b.amount, 0);
  const pendingDues = list.filter(p => p.status === "pending").reduce((a, b) => a + b.amount, 0);
  const now = new Date();
  const monthly = list.filter(p => p.status === "verified" && new Date(p.paymentDate).getMonth() === now.getMonth() && new Date(p.paymentDate).getFullYear() === now.getFullYear()).reduce((a, b) => a + b.amount, 0);
  const overdue = list.filter(p => (p.totalFee - p.paidAmount) > p.totalFee * 0.6).length;

  const revenueTrend = useMemo(() => {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthPayments = list.filter(p => {
        if (p.status !== "verified") return false;
        const pd = new Date(p.paymentDate);
        return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
      });
      months.push({
        month: d.toLocaleDateString("en", { month: "short" }),
        revenue: monthPayments.reduce((sum, p) => sum + p.amount, 0),
      });
    }
    return months;
  }, [list, now]);

  const verifyMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.payments.update(id, { status: status as Payment["status"] }),
    onSuccess: (_, vars) => {
      toast.success(`Payment ${vars.status}`);
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error("Failed to update payment"),
  });

  const exportCSV = () => {
    const headers = ["Student", "Course", "Amount", "Method", "Date", "Txn ID", "Status"];
    const rows = filtered.map(p => [p.studentName, p.courseName, String(p.amount), p.paymentMethod, p.paymentDate, p.transactionId, p.status]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  return (
    <AdminLayout title="Payment Management" subtitle="Verify, track, and reconcile every transaction.">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={formatPKR(revenue)} icon={Wallet} tone="success" />
        <StatCard label="Monthly Income" value={formatPKR(monthly)} icon={TrendingUp} tone="info" />
        <StatCard label="Pending Dues" value={formatPKR(pendingDues)} icon={Clock} tone="warning" />
        <StatCard label="Overdue Students" value={overdue} icon={AlertTriangle} tone="warning" />
      </div>

      <Card className="mt-6 rounded-2xl">
        <CardHeader><CardTitle>Collection Report</CardTitle><CardDescription>Verified revenue over time.</CardDescription></CardHeader>
        <CardContent className="h-56">
          <ResponsiveContainer>
            <LineChart data={revenueTrend}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="month" stroke="currentColor" opacity={0.5} fontSize={11} />
              <YAxis stroke="currentColor" opacity={0.5} fontSize={11} tickFormatter={v => `${(v / 100000).toFixed(0)}L`} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", borderRadius: 10, border: "1px solid hsl(var(--border))" }} formatter={(v: number) => formatPKR(v)} />
              <Line type="monotone" dataKey="revenue" stroke="currentColor" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="mt-4 rounded-2xl p-3 sm:p-4 md:p-5">
        <div className="flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search student, course, transaction…" className="h-10 pl-9" />
          </div>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="w-[140px] sm:w-[170px]"><SelectValue placeholder="Method" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All methods</SelectItem>
              <SelectItem value="JazzCash">JazzCash</SelectItem>
              <SelectItem value="EasyPaisa">EasyPaisa</SelectItem>
              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Card">Card</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[130px] sm:w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> Add</Button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Student</TableHead>
                <TableHead className="hidden md:table-cell">Course</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden lg:table-cell">Balance</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="hidden lg:table-cell">Txn ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 9 }).map((__, j) => <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>)}</TableRow>
              )) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">No payments match your filters.</TableCell></TableRow>
              ) : filtered.map(p => (
                <TableRow key={p.id} className="hover:bg-muted/40">
                  <TableCell><div className="font-semibold">{p.studentName}</div></TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{p.courseName}</TableCell>
                  <TableCell className="font-semibold">{formatPKR(p.amount)}</TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{formatPKR(p.totalFee - p.paidAmount)}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{formatDate(p.paymentDate)}</TableCell>
                  <TableCell><span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{p.paymentMethod}</span></TableCell>
                  <TableCell className="hidden lg:table-cell text-xs font-mono">{p.transactionId}</TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => verifyMutation.mutate({ id: p.id, status: "verified" })}><CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Verify</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => verifyMutation.mutate({ id: p.id, status: "rejected" })}><XCircle className="mr-2 h-4 w-4 text-rose-500" /> Reject</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setPreview(p.screenshotUrl ?? null)} disabled={!p.screenshotUrl}><Eye className="mr-2 h-4 w-4" /> View screenshot</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => exportCSV()}><FileText className="mr-2 h-4 w-4" /> Export</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-3 flex justify-end">
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="mr-1.5 h-4 w-4" /> Export CSV</Button>
        </div>
      </Card>

      <Dialog open={!!preview} onOpenChange={o => !o && setPreview(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Payment screenshot</DialogTitle></DialogHeader>
          {preview && <img src={preview} alt="screenshot" className="w-full rounded-xl" />}
        </DialogContent>
      </Dialog>

      <AddPaymentDialog open={addOpen} onClose={() => setAddOpen(false)} students={students ?? []} />
    </AdminLayout>
  );
}

function AddPaymentDialog({
  open,
  onClose,
  students,
}: {
  open: boolean;
  onClose: () => void;
  students: Student[];
}) {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState("Bank Transfer");
  const [refNo, setRefNo] = useState("");

  const genRef = () => {
    const d = new Date();
    const ts = d.getFullYear().toString() +
      String(d.getMonth() + 1).padStart(2, "0") +
      String(d.getDate()).padStart(2, "0") +
      String(d.getHours()).padStart(2, "0") +
      String(d.getMinutes()).padStart(2, "0") +
      String(d.getSeconds()).padStart(2, "0");
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN-${ts}-${rand}`;
  };

  useMemo(() => {
    if (open) {
      setSelectedId("");
      setAmount(0);
      setMethod("Bank Transfer");
      setRefNo(genRef());
    }
  }, [open]);

  const selected = students.find(s => s.id === selectedId);

  const mutation = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error("No student selected");
      return api.payments.create({
        id: "",
        studentId: selected.id,
        studentName: selected.name,
        courseName: selected.courseName,
        totalFee: selected.totalFee,
        paidAmount: selected.paidAmount,
        amount,
        paymentDate: new Date().toISOString(),
        paymentMethod: method as Payment["paymentMethod"],
        transactionId: refNo,
        status: "pending",
      });
    },
    onSuccess: () => {
      toast.success("Payment recorded");
      if (selected) {
        generatePaymentSlip({
          studentName: selected.name,
          courseName: selected.courseName,
          amount,
          totalFee: selected.totalFee,
          paidAmount: selected.paidAmount,
          paymentMethod: method,
          transactionId: refNo,
          paymentDate: new Date().toISOString(),
          status: "pending",
        });
      }
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setSelectedId("");
      setAmount(0);
      onClose();
    },
    onError: () => toast.error("Failed to record payment"),
  });

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
          <DialogDescription>Record a new payment transaction.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 mt-4">
          <div>
            <Label>Student</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>
                {students.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name} — {s.courseName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selected && (
            <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
              Total Fee: {formatPKR(selected.totalFee)} · Paid: {formatPKR(selected.paidAmount)} · Remaining: {formatPKR(selected.totalFee - selected.paidAmount)}
            </div>
          )}
          <div><Label>Amount (PKR)</Label><Input type="number" value={amount || ""} onChange={e => setAmount(Number(e.target.value))} placeholder="Enter amount" /></div>
          <div>
            <Label>Payment Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="JazzCash">JazzCash</SelectItem>
                <SelectItem value="EasyPaisa">EasyPaisa</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Reference / Transaction ID</Label><Input value={refNo} onChange={e => setRefNo(e.target.value)} placeholder="Auto-generated" /></div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !selectedId || amount <= 0}>
            {mutation.isPending ? "Recording…" : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
