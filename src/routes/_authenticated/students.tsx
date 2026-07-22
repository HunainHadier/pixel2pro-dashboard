import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Filter,
  Download,
  Printer,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Eye,
  Pencil,
  Wallet,
  MessageCircle,
  Mail,
  Trash2,
  FileText,
  Send,
  RotateCcw,
  Clock,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { StatusBadge } from "@/components/admin/badges";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { api } from "@/services/api";
import { formatPKR, formatDate, type Student, type Payment } from "@/lib/mock-data";
import { generatePaymentSlip } from "@/lib/payment-slip";
import { generateAdmissionSlip } from "@/lib/admission-slip";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/students")({
  head: () => ({ meta: [{ title: "Students — Pixel2Pro Admin" }] }),
  component: StudentsPage,
});

function StudentsPage() {
  const qc = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["students"],
    queryFn: () => api.enrollments.list(),
  });
  const { data: coursesData } = useQuery({
    queryKey: ["courses"],
    queryFn: () => api.courses.list(),
  });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [course, setCourse] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Student | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [addPaymentStudent, setAddPaymentStudent] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const pageSize = 8;

  const filtered = useMemo(() => {
    const list = data ?? [];
    return list.filter((s) => {
      const matchQ =
        !q ||
        [s.name, s.email, s.phone, s.city, s.courseName].some((v) =>
          v.toLowerCase().includes(q.toLowerCase()),
        );
      const matchStatus = status === "all" || s.admissionStatus === status;
      const matchCourse = course === "all" || s.courseName === course;
      return matchQ && matchStatus && matchCourse;
    });
  }, [data, q, status, course]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const courseOptions = Array.from(new Set((data ?? []).map((s) => s.courseName)));

  const statusMutation = useMutation({
    mutationFn: ({ id, admissionStatus }: { id: string; admissionStatus: Student["admissionStatus"] }) =>
      api.enrollments.update(id, { admissionStatus }),
    onSuccess: (_, variables) => {
      toast.success(`Admission ${variables.admissionStatus}`);
      const s = data?.find(st => st.id === variables.id);
      if (s && (variables.admissionStatus === "confirmed" || variables.admissionStatus === "rejected")) {
        generateAdmissionSlip({
          studentName: s.name,
          email: s.email,
          phone: s.phone,
          city: s.city,
          courseName: s.courseName,
          totalFee: s.totalFee,
          status: variables.admissionStatus,
          governmentId: s.governmentId,
          guardianName: s.guardian?.name,
          guardianPhone: s.guardian?.phone,
        });
      }
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error("Failed to update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.enrollments.delete(id),
    onSuccess: () => {
      toast.success("Student deleted");
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error("Failed to delete student"),
  });

  const notesMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      api.enrollments.update(id, { notes }),
    onSuccess: () => {
      toast.success("Remarks saved");
      qc.invalidateQueries({ queryKey: ["students"] });
    },
    onError: () => toast.error("Failed to save remarks"),
  });

  const doAction = (
    label: string,
    student?: Student,
    admissionStatus?: Student["admissionStatus"],
  ) => {
    if (student && admissionStatus) {
      statusMutation.mutate({ id: student.id, admissionStatus });
    } else {
      toast.success(label);
    }
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Phone", "City", "Course", "Status", "Total Fee", "Paid", "Enrolled"];
    const rows = filtered.map((s) => [
      s.name, s.email, s.phone, s.city, s.courseName, s.admissionStatus,
      String(s.totalFee), String(s.paidAmount), s.enrollmentDate,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  const exportExcel = () => {
    const headers = ["Name", "Email", "Phone", "City", "Course", "Status", "Total Fee", "Paid", "Enrolled"];
    const rows = filtered.map((s) => [
      s.name, s.email, s.phone, s.city, s.courseName, s.admissionStatus,
      String(s.totalFee), String(s.paidAmount), s.enrollmentDate,
    ]);
    const tsv = [headers, ...rows].map((r) => r.join("\t")).join("\n");
    const blob = new Blob([tsv], { type: "text/tab-separated-values" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students-${new Date().toISOString().slice(0, 10)}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel downloaded");
  };

  return (
    <AdminLayout
      title="Student Management"
      subtitle="Admissions, fees, documents, and lifecycle actions."
    >
      <Card className="rounded-2xl p-3 sm:p-4 md:p-5">
        <div className="flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email, phone, city, course…"
              className="h-10 pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[130px] sm:w-[150px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={course}
              onValueChange={(v) => {
                setCourse(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[140px] sm:w-[190px]">
                <SelectValue placeholder="Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All courses</SelectItem>
                {courseOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="hidden sm:flex" onClick={exportExcel}>
              <Download className="mr-1.5 h-4 w-4" /> Excel
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:flex" onClick={exportCSV}>
              <Download className="mr-1.5 h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-4 w-4" /> Print
            </Button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Student</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead className="hidden lg:table-cell">City</TableHead>
                <TableHead>Course</TableHead>
                <TableHead className="hidden md:table-cell">Enrolled</TableHead>
                <TableHead>Admission</TableHead>
                <TableHead className="hidden lg:table-cell">Fees</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paged.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    No students match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={s.avatar} />
                          <AvatarFallback>{s.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{s.name}</div>
                          <div className="truncate text-xs text-muted-foreground md:hidden">
                            {s.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm">{s.email}</div>
                      <div className="text-xs text-muted-foreground">{s.phone}</div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{s.city}</TableCell>
                    <TableCell className="text-sm">{s.courseName}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {formatDate(s.enrollmentDate)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={s.admissionStatus} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={s.feeStatus} />
                        <span className="text-xs text-muted-foreground">
                          {formatPKR(s.totalFee - s.paidAmount)} left
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onSelect={() => { setSelected(s); setNotesValue(s.notes || ""); }}>
                            <Eye className="mr-2 h-4 w-4" /> View profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => { setSelected(s); setEditMode(true); }}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {s.admissionStatus !== "confirmed" ? (
                            <DropdownMenuItem
                              onSelect={() => doAction("Admission confirmed", s, "confirmed")}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Confirm admission
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onSelect={() => doAction("Admission moved to pending", s, "pending")}
                            >
                              <RotateCcw className="mr-2 h-4 w-4 text-amber-500" /> Unconfirm (revert to pending)
                            </DropdownMenuItem>
                          )}
                          {s.admissionStatus !== "rejected" && (
                            <DropdownMenuItem
                              onSelect={() => doAction("Admission rejected", s, "rejected")}
                            >
                              <XCircle className="mr-2 h-4 w-4 text-rose-500" /> Reject admission
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => setAddPaymentStudent(s)}>
                            <Wallet className="mr-2 h-4 w-4" /> Add payment
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => setDeleteTarget(s)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
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

        <div className="mt-3 flex flex-col items-center gap-3 text-sm sm:flex-row sm:justify-between">
          <div className="text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{paged.length}</span> of{" "}
            {filtered.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </Button>
            <span className="text-xs">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* View / Edit Dialog */}
      <Dialog open={!!selected && !editMode} onOpenChange={(o) => { if (!o) { setSelected(null); setNotesValue(""); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selected.avatar} />
                    <AvatarFallback>{selected.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <DialogTitle className="truncate">{selected.name}</DialogTitle>
                    <DialogDescription className="truncate">
                      {selected.email} · {selected.phone}
                    </DialogDescription>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <StatusBadge status={selected.admissionStatus} />
                    <StatusBadge status={selected.feeStatus} />
                  </div>
                </div>
              </DialogHeader>
              <Tabs defaultValue="info" className="mt-2">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info" className="text-xs">Info</TabsTrigger>
                  <TabsTrigger value="payments" className="text-xs">Payments</TabsTrigger>
                  <TabsTrigger value="docs" className="text-xs">Docs</TabsTrigger>
                  <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
                </TabsList>
                <TabsContent value="info" className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="City" value={selected.city} />
                  <Field label="Course" value={selected.courseName} />
                  <Field label="Enrollment date" value={formatDate(selected.enrollmentDate)} />
                  <Field label="Total fee" value={formatPKR(selected.totalFee)} />
                  <Field label="Paid" value={formatPKR(selected.paidAmount)} />
                  <Field label="Remaining" value={formatPKR(selected.totalFee - selected.paidAmount)} />
                  <Field label="Government ID" value={selected.governmentId || "N/A"} />
                  <Field label="Professional Profile" value={selected.professionalProfile || "N/A"} />
                  <Field label="Source Track ID" value={selected.sourceTrackId || "N/A"} />
                  <Field label="Terms Accepted" value={selected.termsAccepted ? "Yes" : "No"} />
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Guardian
                    </p>
                    <p className="mt-1 text-sm">
                      {selected.guardian?.name || "N/A"}{" "}
                      <span className="text-muted-foreground">({selected.guardian?.relation || ""})</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{selected.guardian?.phone || ""}</p>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Admin remarks
                    </p>
                    <Textarea
                      className="mt-1"
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      rows={3}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="payments" className="mt-4">
                  <StudentPaymentsTab enrollmentId={selected.id} />
                </TabsContent>
                <TabsContent value="docs" className="mt-4 space-y-2">
                  {selected.governmentId ? (
                    <div className="flex items-center justify-between rounded-xl border border-border p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" /> Government ID
                      </div>
                      <span className="text-xs text-muted-foreground">{selected.governmentId}</span>
                    </div>
                  ) : (
                    <p className="py-6 text-center text-sm text-muted-foreground">No documents uploaded.</p>
                  )}
                </TabsContent>
                <TabsContent value="timeline" className="mt-4">
                  <ol className="relative space-y-4 border-l border-border pl-4 text-sm">
                    <li>
                      <span className="absolute -left-[7px] h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                      Enrollment received — {formatDate(selected.enrollmentDate)}
                    </li>
                    {selected.admissionStatus === "confirmed" || selected.admissionStatus === "completed" ? (
                      <li>
                        <span className="absolute -left-[7px] h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-background" />
                        Admission confirmed
                      </li>
                    ) : selected.admissionStatus === "rejected" ? (
                      <li>
                        <span className="absolute -left-[7px] h-3 w-3 rounded-full bg-rose-500 ring-4 ring-background" />
                        Admission rejected
                      </li>
                    ) : selected.admissionStatus === "suspended" ? (
                      <li>
                        <span className="absolute -left-[7px] h-3 w-3 rounded-full bg-amber-500 ring-4 ring-background" />
                        Student suspended
                      </li>
                    ) : (
                      <li>
                        <span className="absolute -left-[7px] h-3 w-3 rounded-full bg-muted ring-4 ring-background" />
                        Awaiting admin confirmation
                      </li>
                    )}
                    {selected.paidAmount > 0 && (
                      <li>
                        <span className="absolute -left-[7px] h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                        Payment recorded — {formatPKR(selected.paidAmount)} paid
                      </li>
                    )}
                    {selected.admissionStatus === "completed" && (
                      <li>
                        <span className="absolute -left-[7px] h-3 w-3 rounded-full bg-sky-500 ring-4 ring-background" />
                        Course completed
                      </li>
                    )}
                  </ol>
                </TabsContent>
              </Tabs>
              <DialogFooter className="mt-4 flex flex-wrap gap-2 sm:flex-nowrap">
                {selected.admissionStatus !== "confirmed" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => doAction("Admission confirmed", selected, "confirmed")}
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-500" /> Confirm
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => doAction("Admission moved to pending", selected, "pending")}
                  >
                    <RotateCcw className="mr-1.5 h-4 w-4 text-amber-500" /> Unconfirm
                  </Button>
                )}
                {selected.admissionStatus !== "rejected" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => doAction("Admission rejected", selected, "rejected")}
                  >
                    <XCircle className="mr-1.5 h-4 w-4 text-rose-500" /> Reject
                  </Button>
                )}
                {selected.admissionStatus !== "completed" && selected.admissionStatus !== "suspended" && (
                  <Button variant="outline" size="sm" onClick={() => doAction("Suspended", selected, "suspended")}>
                    <Clock className="mr-1.5 h-4 w-4" /> Suspend
                  </Button>
                )}
                {selected.admissionStatus !== "completed" && selected.admissionStatus !== "suspended" && (
                  <Button variant="outline" size="sm" onClick={() => doAction("Course completed", selected, "completed")}>
                    <CheckCircle2 className="mr-1.5 h-4 w-4" /> Complete
                  </Button>
                )}
                <div className="flex-1" />
                <Button variant="outline" size="sm" onClick={() => window.open(`https://wa.me/${selected.phone.replace(/\D/g, "")}`, "_blank")}>
                  <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.open(`mailto:${selected.email}`, "_blank")}>
                  <Mail className="mr-1.5 h-4 w-4" /> Email
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    notesMutation.mutate({ id: selected.id, notes: notesValue });
                    setSelected(null);
                  }}
                >
                  <Send className="mr-1.5 h-4 w-4" /> Save
                </Button>
              </DialogFooter>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <Badge variant="outline" className="rounded-full">
                  ID: {selected.id}
                </Badge>
                <span>Remaining balance auto-calculated</span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <EditStudentDialog
        open={editMode && !!selected}
        onClose={() => { setEditMode(false); setSelected(null); }}
        student={selected}
        courses={coursesData ?? []}
      />

      {/* Add Payment Dialog */}
      <AddPaymentDialog
        open={!!addPaymentStudent}
        onClose={() => setAddPaymentStudent(null)}
        student={addPaymentStudent}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

function StudentPaymentsTab({ enrollmentId }: { enrollmentId: string }) {
  const { data: payments, isLoading } = useQuery({
    queryKey: ["enrollment-payments", enrollmentId],
    queryFn: () => api.enrollments.payments(enrollmentId),
  });
  const list = payments ?? [];

  if (isLoading) return <Skeleton className="h-32 w-full rounded-xl" />;

  return (
    <div className="space-y-3">
      {list.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No payments recorded yet.</p>
      ) : (
        list.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-xl border border-border p-3">
            <div>
              <div className="text-sm font-semibold">{formatPKR(p.amount)}</div>
              <div className="text-xs text-muted-foreground">{p.paymentMethod} · {p.transactionId}</div>
            </div>
            <div className="text-right">
              <StatusBadge status={p.status} />
              <div className="mt-1 text-xs text-muted-foreground">{formatDate(p.paymentDate)}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function EditStudentDialog({
  open,
  onClose,
  student,
  courses,
}: {
  open: boolean;
  onClose: () => void;
  student: Student | null;
  courses: { id: string; courseName: string; price: number }[];
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    courseId: "",
    courseName: "",
    totalFee: 0,
    governmentId: "",
    professionalProfile: "",
    guardianName: "",
    guardianPhone: "",
    guardianRelation: "",
  });

  useMemo(() => {
    if (student) {
      setForm({
        name: student.name,
        email: student.email,
        phone: student.phone,
        city: student.city,
        courseId: student.courseId,
        courseName: student.courseName,
        totalFee: student.totalFee,
        governmentId: student.governmentId || "",
        professionalProfile: student.professionalProfile || "",
        guardianName: student.guardian?.name || "",
        guardianPhone: student.guardian?.phone || "",
        guardianRelation: student.guardian?.relation || "",
      });
    }
  }, [student]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!student) throw new Error("No student");
      return api.enrollments.update(student.id, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        courseId: form.courseId,
        courseName: form.courseName,
        totalFee: form.totalFee,
        governmentId: form.governmentId,
        professionalProfile: form.professionalProfile,
        guardian: { name: form.guardianName, phone: form.guardianPhone, relation: form.guardianRelation },
      });
    },
    onSuccess: () => {
      toast.success("Student updated");
      qc.invalidateQueries({ queryKey: ["students"] });
      onClose();
    },
    onError: () => toast.error("Failed to update student"),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>Update student enrollment details.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
          <div><Label>Full name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div>
            <Label>Course</Label>
            <Select value={form.courseId} onValueChange={(v) => {
              const c = courses.find((c) => c.id === v);
              setForm({ ...form, courseId: v, courseName: c?.courseName || "", totalFee: c?.price || form.totalFee });
            }}>
              <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.courseName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Total Fee</Label><Input type="number" value={form.totalFee} onChange={(e) => setForm({ ...form, totalFee: Number(e.target.value) })} /></div>
          <div><Label>Government ID</Label><Input value={form.governmentId} onChange={(e) => setForm({ ...form, governmentId: e.target.value })} /></div>
          <div><Label>Professional Profile</Label><Input value={form.professionalProfile} onChange={(e) => setForm({ ...form, professionalProfile: e.target.value })} /></div>
          <div><Label>Guardian Name</Label><Input value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} /></div>
          <div><Label>Guardian Phone</Label><Input value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} /></div>
          <div><Label>Guardian Relation</Label><Input value={form.guardianRelation} onChange={(e) => setForm({ ...form, guardianRelation: e.target.value })} /></div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddPaymentDialog({
  open,
  onClose,
  student,
}: {
  open: boolean;
  onClose: () => void;
  student: Student | null;
}) {
  const qc = useQueryClient();
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
      setAmount(0);
      setMethod("Bank Transfer");
      setRefNo(genRef());
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!student) throw new Error("No student");
      return api.payments.create({
        id: "",
        studentId: student.id,
        studentName: student.name,
        courseName: student.courseName,
        totalFee: student.totalFee,
        paidAmount: student.paidAmount,
        amount,
        paymentDate: new Date().toISOString(),
        paymentMethod: method as Payment["paymentMethod"],
        transactionId: refNo,
        status: "pending",
      });
    },
    onSuccess: () => {
      toast.success("Payment recorded");
      if (student) {
        generatePaymentSlip({
          studentName: student.name,
          courseName: student.courseName,
          amount,
          totalFee: student.totalFee,
          paidAmount: student.paidAmount,
          paymentMethod: method,
          transactionId: refNo,
          paymentDate: new Date().toISOString(),
          status: "pending",
        });
      }
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setAmount(0);
      onClose();
    },
    onError: () => toast.error("Failed to record payment"),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
          <DialogDescription>
            Record a payment for <strong>{student?.name}</strong>. Remaining: {formatPKR((student?.totalFee ?? 0) - (student?.paidAmount ?? 0))}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 mt-4">
          <div><Label>Amount (PKR)</Label><Input type="number" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Enter amount" /></div>
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
          <div><Label>Reference / Transaction ID</Label><Input value={refNo} onChange={(e) => setRefNo(e.target.value)} placeholder="Auto-generated" /></div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || amount <= 0}>
            {mutation.isPending ? "Recording…" : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
