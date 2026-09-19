import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@/components/admin/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/services/api";
import type { Course } from "@/lib/mock-data";
import { getFeePlans } from "@/lib/mock-data";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  courses: Course[];
}

export function AddStudentDialog({ open, onClose, courses }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    courseId: "",
    feePlanId: "lump-sum",
    governmentId: "",
    professionalProfile: "",
    guardianName: "",
    guardianPhone: "",
    guardianRelation: "",
    notes: "",
    termsAccepted: true,
  });

  const selectedCourse = courses.find((c) => c.id === form.courseId);
  const feePlans = selectedCourse ? getFeePlans(selectedCourse) : [];
  const selectedFeePlan =
    feePlans.find((p) => p.id === form.feePlanId) ??
    feePlans.find((p) => p.type === "lump-sum") ??
    feePlans[0];

  const mutation = useMutation({
    mutationFn: () => {
      const months = parseInt(selectedCourse?.duration || "") || 1;
      const totalFee =
        selectedFeePlan?.totalFee ??
        (selectedCourse
          ? (selectedCourse.monthlyFee || 0) * months || selectedCourse.price || 0
          : 0);
      return api.enrollments.create({
        name: form.name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        courseId: form.courseId,
        courseName: selectedCourse?.courseName || "",
        totalFee,
        admissionStatus: "pending",
        termsAccepted: form.termsAccepted,
        governmentId: form.governmentId,
        professionalProfile: form.professionalProfile,
        sourceTrackId: "manual-admin",
        guardian: {
          name: form.guardianName,
          phone: form.guardianPhone,
          relation: form.guardianRelation,
        },
      });
    },
    onSuccess: () => {
      toast.success("Student created");
      setForm({
        name: "",
        email: "",
        phone: "",
        city: "",
        courseId: "",
        feePlanId: "lump-sum",
        governmentId: "",
        professionalProfile: "",
        guardianName: "",
        guardianPhone: "",
        guardianRelation: "",
        notes: "",
        termsAccepted: true,
      });
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      onClose();
    },
    onError: () => toast.error("Failed to create student"),
  });

  const valid = form.name && form.email && form.phone && form.city && form.courseId;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Student</DialogTitle>
          <DialogDescription>
            Manually create a student record, independent of the website flow.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
          <div>
            <Label>Full name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <Label>WhatsApp / Phone *</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <Label>City / Country *</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <Label>Course *</Label>
            <Select
              value={form.courseId}
              onValueChange={(v) => setForm({ ...form, courseId: v, feePlanId: "lump-sum" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.courseName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {feePlans.length > 0 && (
            <div>
              <Label>Payment Plan *</Label>
              <Select
                value={form.feePlanId}
                onValueChange={(v) => setForm({ ...form, feePlanId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment plan" />
                </SelectTrigger>
                <SelectContent>
                  {feePlans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title} — PKR {p.totalFee.toLocaleString()}
                      {p.registrationFee > 0
                        ? ` (reg ${p.registrationFee.toLocaleString()})`
                        : " (no reg fee)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedFeePlan && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Total fee: PKR {selectedFeePlan.totalFee.toLocaleString()}
                  {selectedFeePlan.registrationFee > 0
                    ? ` incl. registration PKR ${selectedFeePlan.registrationFee.toLocaleString()}`
                    : " — no registration fee"}
                </p>
              )}
            </div>
          )}
          <div>
            <Label>Government ID</Label>
            <Input
              value={form.governmentId}
              onChange={(e) => setForm({ ...form, governmentId: e.target.value })}
            />
          </div>
          <div>
            <Label>Current Professional Profile</Label>
            <Input
              value={form.professionalProfile}
              onChange={(e) => setForm({ ...form, professionalProfile: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Guardian Name</Label>
            <Input
              value={form.guardianName}
              onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
            />
          </div>
          <div>
            <Label>Guardian Phone</Label>
            <Input
              value={form.guardianPhone}
              onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
            />
          </div>
          <div>
            <Label>Guardian Relation</Label>
            <Input
              value={form.guardianRelation}
              onChange={(e) => setForm({ ...form, guardianRelation: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !valid}>
            {mutation.isPending ? (
              <>
                <Spinner className="mr-1.5 h-4 w-4" /> Creating…
              </>
            ) : (
              "Create Student"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
