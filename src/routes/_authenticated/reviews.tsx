import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  Pin,
  Plus,
  Video,
  Upload,
  X,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { StatusBadge } from "@/components/admin/badges";
import { Spinner } from "@/components/admin/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { api } from "@/services/api";
import { formatDate } from "@/lib/mock-data";
import { uploadToStorage } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reviews")({
  head: () => ({ meta: [{ title: "Reviews — Pixel2Pro Admin" }] }),
  component: ReviewsPage,
});

function ReviewsPage() {
  const qc = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["reviews"],
    queryFn: () => api.reviews.list(),
  });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    studentName: "",
    courseName: "",
    rating: "5",
    message: "",
    publish: true,
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const setField = (key: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const list = useMemo(() => {
    let l = data ?? [];
    if (q)
      l = l.filter((r) =>
        (r.studentName + r.courseName + r.message).toLowerCase().includes(q.toLowerCase()),
      );
    if (status !== "all") l = l.filter((r) => r.status === status);
    if (sort === "newest")
      l = [...l].sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt));
    if (sort === "rating") l = [...l].sort((a, b) => b.rating - a.rating);
    return l;
  }, [data, q, status, sort]);

  const act = async (label: string, id: string, patch: Record<string, unknown>) => {
    setBusyId(id);
    try {
      await api.reviews.update(id, patch as never);
      toast.success(label);
      refetch();
    } catch {
      toast.error(`Failed: ${label}`);
    } finally {
      setBusyId(null);
    }
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

  const createMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      const ts = Date.now();
      const safeName = form.studentName.trim().replace(/\s+/g, "-").toLowerCase();
      let videoUrl: string | undefined;
      let thumbnailUrl: string | undefined;

      try {
        if (videoFile) {
          const ext = videoFile.name.split(".").pop() || "mp4";
          const path = `reviews/${safeName}-${ts}.${ext}`;
          videoUrl = (await uploadToStorage(videoFile, path, "testimonials")) || undefined;
        }
        if (thumbnailFile) {
          const ext = thumbnailFile.name.split(".").pop() || "jpg";
          const path = `reviews/${safeName}-thumb-${ts}.${ext}`;
          thumbnailUrl = (await uploadToStorage(thumbnailFile, path, "testimonials")) || undefined;
        }

        return api.reviews.create({
          id: "",
          studentName: form.studentName.trim(),
          studentAvatar: "",
          courseName: form.courseName.trim(),
          rating: Number(form.rating),
          message: form.message.trim(),
          videoUrl,
          thumbnailUrl,
          submittedAt: new Date().toISOString(),
          status: form.publish ? "approved" : "pending",
          pinned: false,
        });
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      toast.success(form.publish ? "Review added and published" : "Review added as pending");
      setAddOpen(false);
      setForm({ studentName: "", courseName: "", rating: "5", message: "", publish: true });
      setVideoFile(null);
      setThumbnailFile(null);
      refetch();
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error("Failed to add review"),
  });

  return (
    <AdminLayout
      title="Reviews Manager"
      subtitle="Moderate testimonials before they appear on the public site."
    >
      <Card className="rounded-2xl p-3 sm:p-4 md:p-5">
        <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search reviews…"
              className="h-10 pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[130px] sm:w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[130px] sm:w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="rating">Highest rating</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setAddOpen(true)} className="h-10 shrink-0">
            <Plus className="mr-1.5 h-4 w-4" /> Add Review
          </Button>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))
          : list.map((r) => (
              <Card key={r.id} className="rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={r.studentAvatar} />
                      <AvatarFallback>{r.studentName[0]}</AvatarFallback>
                    </Avatar>
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
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`}
                      />
                    ))}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {formatDate(r.submittedAt)}
                    </span>
                  </div>
                  {r.videoUrl ? (
                    <div className="mt-3 overflow-hidden rounded-xl border border-border bg-black">
                      <video
                        src={r.videoUrl}
                        poster={r.thumbnailUrl}
                        controls
                        preload="none"
                        className="aspect-video w-full"
                      />
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-relaxed text-foreground/90">"{r.message}"</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === r.id}
                      onClick={() => act("Review approved", r.id, { status: "approved" })}
                    >
                      {busyId === r.id ? (
                        <Spinner className="mr-1 h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-500" />
                      )}{" "}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === r.id}
                      onClick={() => act("Review rejected", r.id, { status: "rejected" })}
                    >
                      {busyId === r.id ? (
                        <Spinner className="mr-1 h-3.5 w-3.5 text-rose-500" />
                      ) : (
                        <XCircle className="mr-1 h-3.5 w-3.5 text-rose-500" />
                      )}{" "}
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === r.id}
                      onClick={() =>
                        act(r.pinned ? "Unpinned" : "Pinned", r.id, { pinned: !r.pinned })
                      }
                    >
                      {busyId === r.id ? (
                        <Spinner className="mr-1 h-3.5 w-3.5" />
                      ) : (
                        <Pin className="mr-1 h-3.5 w-3.5" />
                      )}{" "}
                      {r.pinned ? "Unpin" : "Pin"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteTarget({ id: r.id, name: r.studentName })}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the review by <strong>{deleteTarget?.name}</strong>?
              This action cannot be undone.
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
              {deleteMutation.isPending ? (
                <>
                  <Spinner className="mr-1.5 h-4 w-4" /> Deleting…
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={(o) => !o && setAddOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Review</DialogTitle>
            <DialogDescription>
              Add a video testimonial. It appears on the public website video section once saved as
              approved.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="review-name">Student name</Label>
                <Input
                  id="review-name"
                  value={form.studentName}
                  onChange={(e) => setField("studentName", e.target.value)}
                  placeholder="e.g. Sarah Ahmed"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="review-track">Track / Course</Label>
                <Input
                  id="review-track"
                  value={form.courseName}
                  onChange={(e) => setField("courseName", e.target.value)}
                  placeholder="e.g. Digital Marketing"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="review-rating">Rating</Label>
                <Select value={form.rating} onValueChange={(v) => setField("rating", v)}>
                  <SelectTrigger id="review-rating" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} {n === 1 ? "star" : "stars"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="review-status">Status</Label>
                <Select
                  value={form.publish ? "approved" : "pending"}
                  onValueChange={(v) => setField("publish", v === "approved")}
                >
                  <SelectTrigger id="review-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved (show on site)</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Video</Label>
              {videoFile ? (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                  <Video className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm">{videoFile.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {(videoFile.size / 1048576).toFixed(1)} MB
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoFile(null);
                      if (videoInputRef.current) videoInputRef.current.value = "";
                    }}
                    className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-6 text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:text-foreground"
                >
                  <Upload className="h-6 w-6" />
                  <span className="text-sm font-medium">Click to upload video</span>
                  <span className="text-xs">MP4, WebM, MOV up to 50 MB</span>
                </button>
              )}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    if (f.size > 50 * 1024 * 1024) {
                      toast.error("Video must be under 50 MB");
                      return;
                    }
                    setVideoFile(f);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Upload the review video. It will appear on the website once approved.
              </p>
            </div>
            <div className="grid gap-2">
              <Label>
                Thumbnail <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              {thumbnailFile ? (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                  <img
                    src={URL.createObjectURL(thumbnailFile)}
                    alt="Thumbnail preview"
                    className="h-10 w-10 shrink-0 rounded-md object-cover"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">{thumbnailFile.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setThumbnailFile(null);
                      if (thumbInputRef.current) thumbInputRef.current.value = "";
                    }}
                    className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => thumbInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-5 text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:text-foreground"
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-sm font-medium">Click to upload cover image</span>
                  <span className="text-xs">JPG, PNG, WebP</span>
                </button>
              )}
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    if (f.size > 5 * 1024 * 1024) {
                      toast.error("Thumbnail must be under 5 MB");
                      return;
                    }
                    setThumbnailFile(f);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Cover image for the video. If skipped, student initials are shown.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="review-message">
                Message <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="review-message"
                value={form.message}
                onChange={(e) => setField("message", e.target.value)}
                placeholder="Short review text…"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || uploading || !form.studentName.trim()}
            >
              {createMutation.isPending || uploading ? (
                <>
                  <Spinner className="mr-1.5 h-4 w-4" /> {uploading ? "Uploading…" : "Adding…"}
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 h-4 w-4" /> Add Review
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
