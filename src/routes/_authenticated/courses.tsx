import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye, EyeOff, BookOpen, Users, TrendingUp } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { StatusBadge } from "@/components/admin/badges";
import { Spinner } from "@/components/admin/spinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
  const [busyId, setBusyId] = useState<string | null>(null);

  const doDelete = async (id: string) => {
    setBusyId(id);
    try {
      await api.courses.delete(id);
      toast.success("Course deleted");
      refetch();
    } catch {
      toast.error("Failed to delete course");
    } finally {
      setBusyId(null);
    }
  };
  const togglePublish = async (c: Course) => {
    setBusyId(c.id);
    try {
      await api.courses.update(c.id, { status: c.status === "published" ? "draft" : "published" });
      toast.success(c.status === "published" ? "Unpublished" : "Published");
      refetch();
    } catch {
      toast.error(c.status === "published" ? "Failed to unpublish course" : "Failed to publish course");
    } finally {
      setBusyId(null);
    }
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
              {c.thumbnail && <img src={c.thumbnail} alt={c.courseName} className="absolute inset-0 h-full w-full object-cover" />}
              {!c.thumbnail && <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white, transparent 40%)" }} />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute right-3 top-3 flex flex-col items-end gap-1"><StatusBadge status={c.status} />{c.showOnHome && <span className="rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-bold text-white">#{c.homeOrder ?? "—"} on Home</span>}</div>
              <div className="absolute bottom-3 left-4 text-white">
                <div className="text-[10px] uppercase tracking-widest opacity-80">{c.category}</div>
                <div className="text-lg font-black leading-tight">{c.courseName}</div>
              </div>
            </div>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{c.duration} · {c.level} · {c.classesPerWeek}×/wk · {c.hoursPerClass}h</span>
                <div className="text-right">
                  <div className="text-base font-black text-foreground">{formatPKR(c.price)}</div>
                  {c.discount > 0 && <div className="text-[10px] text-emerald-600 dark:text-emerald-400">{c.discount}% off</div>}
                </div>
              </div>
              {c.monthlyFee > 0 && <div className="mt-1 text-xs text-muted-foreground">Monthly: {formatPKR(c.monthlyFee)}{c.admissionFee !== undefined && ` · Admission: ${formatPKR(c.admissionFee)}`}</div>}
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-border p-3 text-center">
                <Stat icon={Users} label="Students" value={c.students.toString()} />
                <Stat icon={TrendingUp} label="Revenue" value={formatPKRShort(c.revenue)} />
                <Stat icon={BookOpen} label="Completion" value={`${c.completionRate}%`} />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="mr-1 h-3.5 w-3.5" /> Edit</Button>
                <Button size="sm" variant="outline" disabled={busyId === c.id} onClick={() => togglePublish(c)}>
                  {busyId === c.id ? <Spinner className="mr-1 h-3.5 w-3.5" /> : c.status === "published" ? <EyeOff className="mr-1 h-3.5 w-3.5" /> : <Eye className="mr-1 h-3.5 w-3.5" />}
                  {busyId === c.id ? "Working…" : c.status === "published" ? "Unpublish" : "Publish"}
                </Button>
                <Button size="sm" variant="ghost" className="ml-auto text-destructive hover:text-destructive" disabled={busyId === c.id} onClick={() => doDelete(c.id)}>
                  {busyId === c.id ? <Spinner className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                </Button>
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const c = { ...(initial ?? {}), ...form } as Partial<Course>;

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      setForm(f => ({ ...f, thumbnail: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const parseMonths = (duration: string) => {
    const m = parseInt(duration);
    return isNaN(m) ? 1 : m;
  };

  const durationMonths = form.duration !== undefined ? parseMonths(form.duration) : (initial ? parseMonths(initial.duration) : 1);
  const price = form.price ?? initial?.price ?? 0;
  const monthlyFee = form.monthlyFee ?? (price > 0 && durationMonths > 0 ? Math.ceil(price / durationMonths) : 0);

  return (
    <Dialog open={open} onOpenChange={o => { onOpenChange(o); if (!o) { setForm({}); setImagePreview(null); } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? "Edit course" : "Create a course"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Title (Course name) *</Label><Input defaultValue={initial?.courseName} onChange={e => setForm(f => ({ ...f, courseName: e.target.value }))} /></div>
          <div className="sm:col-span-2">
            <Label>Course Image (thumbnail) *</Label>
            <div className="flex items-center gap-3">
              {(imagePreview || initial?.thumbnail) && (
                <img src={imagePreview || initial?.thumbnail || undefined} alt="preview" className="h-16 w-16 rounded-xl border border-border object-cover" />
              )}
              <Input type="file" accept="image/*" onChange={handleImage} className="flex-1" />
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label>Image URL <span className="text-muted-foreground font-normal">— optional, used on website if uploaded thumb is missing</span></Label>
            <Input defaultValue={initial?.imageUrl} placeholder="https://…/course.jpg" onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} />
          </div>
          <div className="sm:col-span-2"><Label>Description *</Label><Textarea rows={3} defaultValue={initial?.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div><Label>Duration (months) *</Label><Input type="number" min={1} defaultValue={initial?.duration ? parseMonths(initial.duration) : 1} onChange={e => setForm(f => ({ ...f, duration: `${e.target.value} month${Number(e.target.value) !== 1 ? "s" : ""}` }))} /></div>
          <div><Label>Classes / Week *</Label><Input type="number" min={1} defaultValue={initial?.classesPerWeek ?? 3} onChange={e => setForm(f => ({ ...f, classesPerWeek: Number(e.target.value) }))} /></div>
          <div><Label>Hours / Class *</Label><Input type="number" step="0.5" min={0.5} defaultValue={initial?.hoursPerClass ?? 1.5} onChange={e => setForm(f => ({ ...f, hoursPerClass: Number(e.target.value) }))} /></div>
          <div>
            <Label>Level *</Label>
            <Select defaultValue={initial?.level} onValueChange={v => setForm(f => ({ ...f, level: v as Course["level"] }))}>
              <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
              <SelectContent><SelectItem value="Beginner">Beginner</SelectItem><SelectItem value="Intermediate">Intermediate</SelectItem><SelectItem value="Advanced">Advanced</SelectItem></SelectContent>
            </Select>
          </div>
          <div>
            <Label>Category *</Label>
            <Input defaultValue={initial?.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
          </div>
          <div>
            <Label>Status *</Label>
            <Select defaultValue={initial?.status ?? "draft"} onValueChange={v => setForm(f => ({ ...f, status: v as Course["status"] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
<Label>Show on Home Page</Label>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div className="text-xs text-muted-foreground">When on, this course appears in the "Choose your next learning path" section on the website home page.</div>
              <Switch checked={c.showOnHome ?? true} onCheckedChange={v => setForm(f => ({ ...f, showOnHome: v }))} />
            </div>
          </div>
          {(c.showOnHome ?? true) && (
            <div className="sm:col-span-2">
              <Label>Home Display Order <span className="text-muted-foreground font-normal">— lower number = appears first. Each number can only be used once.</span></Label>
              <Input type="number" min={1} step={1} defaultValue={initial?.homeOrder ?? ""} placeholder="e.g. 1" onChange={e => setForm(f => ({ ...f, homeOrder: e.target.value === "" ? undefined : Number(e.target.value) }))} />
            </div>
          )}
          <div><Label>Course / Monthly Fee (PKR) *</Label><Input type="number" min={0} defaultValue={monthlyFee} onChange={e => setForm(f => ({ ...f, monthlyFee: Number(e.target.value) }))} /></div>
          <div className="sm:col-span-2">
            <Label>Admission Fee (PKR) <span className="text-muted-foreground font-normal">— optional, overrides global default</span></Label>
            <Input type="number" min={0} defaultValue={initial?.admissionFee ?? ""} placeholder="Leave empty to use global default" onChange={e => setForm(f => ({ ...f, admissionFee: e.target.value === "" ? undefined : Number(e.target.value) }))} />
          </div>
          <div><Label>TOTAL Price (PKR) *</Label><Input type="number" defaultValue={initial?.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} /></div>

          <div className="sm:col-span-2"><Label>Program name (on website) <span className="text-muted-foreground font-normal">— optional</span></Label><Input defaultValue={initial?.programName} onChange={e => setForm(f => ({ ...f, programName: e.target.value }))} /></div>
          <div className="sm:col-span-2"><Label>Track <span className="text-muted-foreground font-normal">— optional</span></Label><Input defaultValue={initial?.track} onChange={e => setForm(f => ({ ...f, track: e.target.value }))} /></div>
          <div className="sm:col-span-2"><Label>Sessions <span className="text-muted-foreground font-normal">e.g. 2 Classes/Week | 2 hours/Day</span></Label><Input defaultValue={initial?.sessions} onChange={e => setForm(f => ({ ...f, sessions: e.target.value }))} /></div>
          <div><Label>Instructor</Label><Input defaultValue={initial?.instructor} onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))} /></div>
          <div><Label>Instructor role</Label><Input defaultValue={initial?.instructorRole} onChange={e => setForm(f => ({ ...f, instructorRole: e.target.value }))} /></div>

          <div className="sm:col-span-2">
            <Label>Overview (long description)</Label>
            <Textarea rows={4} defaultValue={initial?.overview} placeholder="Detailed course overview shown on the program page…" onChange={e => setForm(f => ({ ...f, overview: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <Label>Learning Outcomes <span className="text-muted-foreground font-normal">— one per line</span></Label>
            <Textarea rows={4} defaultValue={(initial?.outcomes ?? []).join("\n")} placeholder={"Build responsive web interfaces…\nUse AI tools to generate code…"} onChange={e => setForm(f => ({ ...f, outcomes: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) }))} />
          </div>
          <div className="sm:col-span-2">
            <Label>Curriculum <span className="text-muted-foreground font-normal">— JSON array, one week per object</span></Label>
            <Textarea rows={6} defaultValue={JSON.stringify(initial?.curriculum ?? [], null, 2)} placeholder='[{ "week": "Module 01", "title": "…", "lessons": ["…", "…"] }]' onChange={e => { try { setForm(f => ({ ...f, curriculum: JSON.parse(e.target.value) })); } catch { /* invalid JSON — ignore until valid */ } }} />
          </div>
          <div className="sm:col-span-2">
            <Label>Industry Trends <span className="text-muted-foreground font-normal">— one per line</span></Label>
            <Textarea rows={3} defaultValue={(initial?.industryTrends ?? []).join("\n")} onChange={e => setForm(f => ({ ...f, industryTrends: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) }))} />
          </div>
        </div>
        <DialogFooter className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" disabled={!c.courseName || !c.description || !c.duration || saving} onClick={async () => {
            setSaving(true);
            try {
              if (initial) { await api.courses.update(initial.id, c); toast.success("Course updated"); }
              else { await api.courses.create({ id: crypto.randomUUID(), courseName: c.courseName ?? "Untitled", category: c.category ?? "General", duration: c.duration ?? "1 month", level: (c.level ?? "Beginner") as Course["level"], price: c.price ?? 0, discount: c.discount ?? 0, status: (c.status ?? "draft") as Course["status"], description: c.description ?? "", thumbnail: c.thumbnail, imageUrl: c.imageUrl, showOnHome: c.showOnHome ?? true, homeOrder: c.homeOrder, students: 0, revenue: 0, completionRate: 0, classesPerWeek: c.classesPerWeek ?? 3, hoursPerClass: c.hoursPerClass ?? 1.5, admissionFee: c.admissionFee, monthlyFee: c.monthlyFee ?? monthlyFee }); toast.success("Course created"); }
              onOpenChange(false); onSaved();
            } catch (e) {
              const msg = e instanceof Error ? e.message : "";
              const isDuplicate = msg.includes("idx_courses_home_order_unique") || msg.includes("duplicate key");
              toast.error(isDuplicate ? "Home Display Order already used — pick a different number." : (initial ? "Failed to update course" : "Failed to create course"));
            } finally {
              setSaving(false);
            }
          }}>{saving ? <><Spinner className="mr-1.5 h-3.5 w-3.5" /> Saving…</> : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}