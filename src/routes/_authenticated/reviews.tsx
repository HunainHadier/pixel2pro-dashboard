import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Star, CheckCircle2, XCircle, Trash2, Pin } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { StatusBadge } from "@/components/admin/badges";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { api } from "@/services/api";
import { formatDate } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reviews")({
  head: () => ({ meta: [{ title: "Reviews — Pixel2Pro Admin" }] }),
  component: ReviewsPage,
});

function ReviewsPage() {
  const qc = useQueryClient();
  const { data, isLoading, refetch } = useQuery({ queryKey: ["reviews"], queryFn: () => api.reviews.list() });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const list = useMemo(() => {
    let l = data ?? [];
    if (q) l = l.filter(r => (r.studentName + r.courseName + r.message).toLowerCase().includes(q.toLowerCase()));
    if (status !== "all") l = l.filter(r => r.status === status);
    if (sort === "newest") l = [...l].sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt));
    if (sort === "rating") l = [...l].sort((a, b) => b.rating - a.rating);
    return l;
  }, [data, q, status, sort]);

  const act = async (label: string, id: string, patch: Record<string, unknown>) => {
    await api.reviews.update(id, patch as never);
    toast.success(label);
    refetch();
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.reviews.delete(id),
    onSuccess: () => {
      toast.success("Review deleted");
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ["reviews"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error("Failed to delete review"),
  });

  return (
    <AdminLayout title="Reviews Manager" subtitle="Moderate testimonials before they appear on the public site.">
      <Card className="rounded-2xl p-3 sm:p-4 md:p-5">
        <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search reviews…" className="h-10 pl-9" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[130px] sm:w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[130px] sm:w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="rating">Highest rating</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />) : list.map(r => (
          <Card key={r.id} className="rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 shrink-0"><AvatarImage src={r.studentAvatar} /><AvatarFallback>{r.studentName[0]}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 truncate font-semibold">{r.studentName}</div>
                    {r.pinned && <Pin className="h-3.5 w-3.5 fill-current text-primary" />}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{r.courseName}</div>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div className="mt-3 flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
                ))}
                <span className="ml-2 text-xs text-muted-foreground">{formatDate(r.submittedAt)}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/90">"{r.message}"</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => act("Review approved", r.id, { status: "approved" })}><CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-500" /> Approve</Button>
                <Button size="sm" variant="outline" onClick={() => act("Review rejected", r.id, { status: "rejected" })}><XCircle className="mr-1 h-3.5 w-3.5 text-rose-500" /> Reject</Button>
                <Button size="sm" variant="outline" onClick={() => act(r.pinned ? "Unpinned" : "Pinned", r.id, { pinned: !r.pinned })}><Pin className="mr-1 h-3.5 w-3.5" /> {r.pinned ? "Unpin" : "Pin"}</Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleteTarget({ id: r.id, name: r.studentName })}><Trash2 className="mr-1 h-3.5 w-3.5" /> Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the review by <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
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