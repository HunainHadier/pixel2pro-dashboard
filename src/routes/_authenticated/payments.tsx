import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  FileText,
  Eye,
  Download,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/admin-layout";
import { StatusBadge } from "@/components/admin/badges";
import { Spinner } from "@/components/admin/spinner";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Wallet, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { api } from "@/services/api";
import { formatPKR, formatDate, type Payment } from "@/lib/mock-data";
import { generatePaymentSlip } from "@/lib/payment-slip";
import { SafeChart } from "@/components/safe-chart";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({ meta: [{ title: "Payments — Pixel2Pro Admin" }] }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["payments"],
    queryFn: () => api.payments.list(),
  });
  const [q, setQ] = useState("");
  const [method, setMethod] = useState("all");
  const [status, setStatus] = useState("all");
  const [preview, setPreview] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Payment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<string | null>(null);

  const list = data ?? [];
  const filtered = useMemo(
    () =>
      list.filter((p) => {
        const mq =
          !q ||
          [p.studentName, p.courseName, p.transactionId].some((v) =>
            v.toLowerCase().includes(q.toLowerCase()),
          );
        return (
          mq &&
          (method === "all" || p.paymentMethod === method) &&
          (status === "all" || p.status === status)
        );
      }),
    [list, q, method, status],
  );

  const revenue = list.filter((p) => p.status === "verified").reduce((a, b) => a + b.amount, 0);
  const pendingDues = list.filter((p) => p.status === "pending").reduce((a, b) => a + b.amount, 0);
  const currentMonthKey = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}`;
  })();
  const monthly = list
    .filter(
      (p) =>
        p.status === "verified" &&
        new Date(p.paymentDate).getMonth() === new Date().getMonth() &&
        new Date(p.paymentDate).getFullYear() === new Date().getFullYear(),
    )
    .reduce((a, b) => a + b.amount, 0);
  const overdue = list.filter((p) => Math.max(0, p.totalFee - p.paidAmount) > p.totalFee * 0.6).length;

  const revenueTrend = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthPayments = list.filter((p) => {
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
  }, [list]);

  const verifyMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => {
      setVerifyTarget(id);
      return api.payments.update(id, { status: status as Payment["status"] });
    },
    onSuccess: (_, vars) => {
      toast.success(`Payment ${vars.status}`);
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error("Failed to update payment"),
    onSettled: () => setVerifyTarget(null),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Payment> }) =>
      api.payments.update(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error("Failed to update payment"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.payments.delete(id),
    onSuccess: () => {
      toast.success("Payment deleted");
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error("Failed to delete payment"),
  });

  const regenerate = async (p: Payment) => {
    setRegenerating(p.id);
    try {
      const url = await generatePaymentSlip({
        studentName: p.studentName,
        courseName: p.courseName,
        amount: p.amount,
        totalFee: p.totalFee,
        paidAmount: Math.max(0, p.paidAmount - p.amount),
        paymentMethod: p.paymentMethod,
        transactionId: p.transactionId,
        paymentDate: p.paymentDate,
        status: p.status,
        type: p.paymentType,
        monthlyFee: p.courseMonthlyFee,
        months: p.courseMonths,
      });
      if (url) await updateMutation.mutateAsync({ id: p.id, patch: { slipUrl: url } });
      if (!url) toast.warning("Slip regenerated, but storage upload failed");
      else toast.success("Slip regenerated and saved");
    } catch {
      toast.error("Failed to regenerate slip");
    } finally {
      setRegenerating(null);
    }
  };

  const openSlip = (url?: string) => {
    if (!url) {
      toast.error("No saved slip for this payment");
      return;
    }
    window.open(url, "_blank");
  };

  const exportCSV = () => {
    const headers = ["Student", "Course", "Amount", "Method", "Date", "Txn ID", "Status"];
    const rows = filtered.map((p) => [
      p.studentName,
      p.courseName,
      String(p.amount),
      p.paymentMethod,
      p.paymentDate,
      p.transactionId,
      p.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
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
    <AdminLayout
      title="Payment Management"
      subtitle="Verify, track, and reconcile every transaction."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={formatPKR(revenue)} icon={Wallet} tone="success" />
        <StatCard label="Monthly Income" value={formatPKR(monthly)} icon={TrendingUp} tone="info" />
        <StatCard label="Pending Dues" value={formatPKR(pendingDues)} icon={Clock} tone="warning" />
        <StatCard label="Overdue Students" value={overdue} icon={AlertTriangle} tone="warning" />
      </div>

      <Card className="mt-6 rounded-2xl">
        <CardHeader>
          <CardTitle>Collection Report</CardTitle>
          <CardDescription>Verified revenue over time.</CardDescription>
        </CardHeader>
        <CardContent className="h-56">
          <SafeChart>
            <ResponsiveContainer>
              <LineChart data={revenueTrend}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 4" vertical={false} />
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
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </SafeChart>
        </CardContent>
      </Card>

      <Card className="mt-4 rounded-2xl p-3 sm:p-4 md:p-5">
        <div className="flex flex-col gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search student, course, transaction…"
              className="h-10 pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="w-[140px] sm:w-[170px]">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
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
              <SelectTrigger className="w-[130px] sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => navigate({ to: "/students" })}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Payment
            </Button>
          </div>
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
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No payments match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="font-semibold">{p.studentName}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{p.courseName}</TableCell>
                    <TableCell className="font-semibold">{formatPKR(p.amount)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {formatPKR(Math.max(0, p.totalFee - p.paidAmount))}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {formatDate(p.paymentDate)}
                    </TableCell>
                    <TableCell>
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                        {p.paymentMethod}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs font-mono">
                      {p.transactionId}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => verifyMutation.mutate({ id: p.id, status: "verified" })}
                            disabled={verifyMutation.isPending && verifyTarget === p.id}
                          >
                            {verifyMutation.isPending && verifyTarget === p.id ? (
                              <Spinner className="mr-2 h-4 w-4 text-emerald-500" />
                            ) : (
                              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                            )}{" "}
                            Verify
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => verifyMutation.mutate({ id: p.id, status: "rejected" })}
                            disabled={verifyMutation.isPending && verifyTarget === p.id}
                          >
                            {verifyMutation.isPending && verifyTarget === p.id ? (
                              <Spinner className="mr-2 h-4 w-4 text-rose-500" />
                            ) : (
                              <XCircle className="mr-2 h-4 w-4 text-rose-500" />
                            )}{" "}
                            Reject
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => openSlip(p.slipUrl)}
                            disabled={!p.slipUrl}
                          >
                            <FileText className="mr-2 h-4 w-4" /> View slip
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => regenerate(p)}
                            disabled={regenerating === p.id}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />{" "}
                            {regenerating === p.id ? "Regenerating…" : "Regenerate slip"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setEditTarget(p)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit payment
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => setDeleteTarget(p)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => setPreview(p.screenshotUrl ?? null)}
                            disabled={!p.screenshotUrl}
                          >
                            <Eye className="mr-2 h-4 w-4" /> View screenshot
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => exportCSV()}>
                            <FileText className="mr-2 h-4 w-4" /> Export
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-3 flex justify-end">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="mr-1.5 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </Card>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment screenshot</DialogTitle>
          </DialogHeader>
          {preview && <img src={preview} alt="screenshot" className="w-full rounded-xl" />}
        </DialogContent>
      </Dialog>

      <EditPaymentDialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        payment={editTarget}
        saving={updateMutation.isPending}
        onSave={(id, patch) =>
          updateMutation.mutate({ id, patch }, { onSuccess: () => setEditTarget(null) })
        }
      />
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment of{" "}
              <strong>{deleteTarget ? formatPKR(deleteTarget.amount) : ""}</strong> for{" "}
              <strong>{deleteTarget?.studentName}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <><Spinner className="mr-1.5 h-4 w-4" /> Deleting…</> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function EditPaymentDialog({
  open,
  onClose,
  payment,
  saving = false,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  payment: Payment | null;
  saving?: boolean;
  onSave: (id: string, patch: Partial<Payment>) => void;
}) {
  const [form, setForm] = useState({
    amount: 0,
    method: "Bank Transfer",
    refNo: "",
    date: "",
    status: "pending",
    type: "monthly" as "admission" | "monthly",
  });

  useEffect(() => {
    if (open && payment) {
      setForm({
        amount: payment.amount,
        method: payment.paymentMethod,
        refNo: payment.transactionId,
        date: payment.paymentDate.slice(0, 10),
        status: payment.status,
        type: payment.paymentType,
      });
    }
  }, [open, payment]);

  const save = () => {
    if (!payment) return;
    onSave(payment.id, {
      amount: form.amount,
      paymentMethod: form.method as Payment["paymentMethod"],
      transactionId: form.refNo,
      paymentDate: `${form.date}T12:00:00`,
      status: form.status as Payment["status"],
      paymentType: form.type,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Payment</DialogTitle>
          <DialogDescription>Update payment details.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 mt-4">
          <div>
            <Label>Amount (PKR)</Label>
            <Input
              type="number"
              min={0}
              value={form.amount || ""}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Payment Method</Label>
            <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="JazzCash">JazzCash</SelectItem>
                <SelectItem value="EasyPaisa">EasyPaisa</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Reference / Transaction ID</Label>
            <Input
              value={form.refNo}
              onChange={(e) => setForm({ ...form, refNo: e.target.value })}
            />
          </div>
          <div>
            <Label>Payment Date</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div>
            <Label>Payment Type</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm({ ...form, type: v as "admission" | "monthly" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admission">Admission Fee</SelectItem>
                <SelectItem value="monthly">Monthly Fee</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={form.amount <= 0 || !form.refNo || saving}>
            {saving ? <><Spinner className="mr-1.5 h-4 w-4" /> Saving…</> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
