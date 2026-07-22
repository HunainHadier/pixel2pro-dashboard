import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye, EyeOff, BookOpen, Users, TrendingUp } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { StatusBadge } from "@/components/admin/badges";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/services/api";
import { formatPKR, formatPKRShort, type Course } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/courses")({
  head: () => ({ meta: [{ title: "Courses — Pixel2Pro Admin" }] }),
  component: CoursesPage,
});

function CoursesPage() {
  const { data, isLoading, refetch } = useQuery({ queryKey: ["courses"], queryFn: () => api.courses.list() });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);

  const doDelete = async (id: string) => { await api.courses.delete(id); toast.success("Course deleted"); refetch(); };
  const togglePublish = async (c: Course) => {
    await api.courses.update(c.id, { status: c.status === "published" ? "draft" : "published" });
    toast.success(c.status === "published" ? "Unpublished" : "Published");
    refetch();
  };

  return (
    <AdminLayout title="Course Management" subtitle="Build, publish, and monitor your curriculum.">
      <div className="mb-3 flex items-center justify-end">
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-1.5 h-4 w-4" /> Create</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />) : (data ?? []).map(c => (
          <Card key={c.id} className="overflow-hidden rounded-2xl transition-shadow hover:shadow-lg">
            <div className="relative h-32 bg-gradient-to-br from-primary to-primary/60">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white, transparent 40%)" }} />
              <div className="absolute right-3 top-3"><StatusBadge status={c.status} /></div>
              <div className="absolute bottom-3 left-4 text-primary-foreground">
                <div className="text-[10px] uppercase tracking-widest opacity-80">{c.category}</div>
                <div className="text-lg font-black leading-tight">{c.courseName}</div>
              </div>
            </div>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{c.duration} · {c.level}</span>
                <div className="text-right">
                  <div className="text-base font-black text-foreground">{formatPKR(c.price)}</div>
                  {c.discount > 0 && <div className="text-[10px] text-emerald-600 dark:text-emerald-400">{c.discount}% off</div>}
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-border p-3 text-center">
                <Stat icon={Users} label="Students" value={c.students.toString()} />
                <Stat icon={TrendingUp} label="Revenue" value={formatPKRShort(c.revenue)} />
                <Stat icon={BookOpen} label="Completion" value={`${c.completionRate}%`} />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="mr-1 h-3.5 w-3.5" /> Edit</Button>
                <Button size="sm" variant="outline" onClick={() => togglePublish(c)}>
                  {c.status === "published" ? <><EyeOff className="mr-1 h-3.5 w-3.5" /> Unpublish</> : <><Eye className="mr-1 h-3.5 w-3.5" /> Publish</>}
                </Button>
                <Button size="sm" variant="ghost" className="ml-auto text-destructive hover:text-destructive" onClick={() => doDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CourseFormDialog open={open} onOpenChange={setOpen} initial={editing} onSaved={() => refetch()} />
    </AdminLayout>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div>
      <Icon className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
      <div className="mt-1 text-sm font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function CourseFormDialog({ open, onOpenChange, initial, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; initial: Course | null; onSaved: () => void }) {
  const [form, setForm] = useState<Partial<Course>>({});
  const c = { ...(initial ?? {}), ...form } as Partial<Course>;

  return (
    <Dialog open={open} onOpenChange={o => { onOpenChange(o); if (!o) setForm({}); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? "Edit course" : "Create a course"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Course name</Label><Input defaultValue={initial?.courseName} onChange={e => setForm(f => ({ ...f, courseName: e.target.value }))} /></div>
          <div><Label>Category</Label><Input defaultValue={initial?.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
          <div><Label>Duration</Label><Input defaultValue={initial?.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} /></div>
          <div>
            <Label>Level</Label>
            <Select defaultValue={initial?.level} onValueChange={v => setForm(f => ({ ...f, level: v as Course["level"] }))}>
              <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
              <SelectContent><SelectItem value="Beginner">Beginner</SelectItem><SelectItem value="Intermediate">Intermediate</SelectItem><SelectItem value="Advanced">Advanced</SelectItem></SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select defaultValue={initial?.status ?? "draft"} onValueChange={v => setForm(f => ({ ...f, status: v as Course["status"] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Price (PKR)</Label><Input type="number" defaultValue={initial?.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} /></div>
          <div><Label>Discount (%)</Label><Input type="number" defaultValue={initial?.discount} onChange={e => setForm(f => ({ ...f, discount: Number(e.target.value) }))} /></div>
          <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={3} defaultValue={initial?.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div className="sm:col-span-2"><Label>Syllabus</Label><Textarea rows={3} placeholder="Module 1: …&#10;Module 2: …" /></div>
        </div>
        <DialogFooter className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={async () => {
            if (initial) { await api.courses.update(initial.id, c); toast.success("Course updated"); }
            else { await api.courses.create({ id: `c${Date.now()}`, courseName: c.courseName ?? "Untitled", category: c.category ?? "General", duration: c.duration ?? "1 month", level: (c.level ?? "Beginner") as Course["level"], price: c.price ?? 0, discount: c.discount ?? 0, status: (c.status ?? "draft") as Course["status"], description: c.description ?? "", students: 0, revenue: 0, completionRate: 0 }); toast.success("Course created"); }
            onOpenChange(false); onSaved();
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}