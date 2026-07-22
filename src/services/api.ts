import type { Activity, Course, Payment, Review, Student } from "@/lib/mock-data";
import { formatDate } from "@/lib/mock-data";
import { supabaseRequest } from "@/lib/supabase";

type Row = Record<string, unknown>;
const n = (value: unknown) => Number(value ?? 0);
const text = (value: unknown, fallback = "") => String(value ?? fallback);
const avatar = (name: string) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=111827`;

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

function mapStudent(row: Row): Student {
  const name = text(row.full_name || row.name, "Student");
  const paidAmount = n(row.paid_amount);
  const totalFee = n(row.total_fee);
  return {
    id: text(row.id),
    name,
    avatar: text(row.avatar_url, avatar(name)),
    email: text(row.email),
    phone: text(row.whatsapp_number || row.phone),
    city: text(row.city_country || row.city),
    courseId: text(row.course_id),
    courseName: text(row.exact_program || row.course_name, "Unassigned"),
    enrollmentDate: text(row.created_at),
    admissionStatus: text(row.status, "pending") as Student["admissionStatus"],
    feeStatus:
      paidAmount >= totalFee && totalFee > 0 ? "paid" : paidAmount > 0 ? "partial" : "unpaid",
    totalFee,
    paidAmount,
    governmentId: text(row.government_id),
    professionalProfile: text(row.current_professional_profile),
    termsAccepted: Boolean(row.terms_privacy_accepted),
    sourceTrackId: text(row.source_track_id),
    guardian: {
      name: text(row.guardian_name),
      phone: text(row.guardian_phone),
      relation: text(row.guardian_relation),
    },
    notes: text(row.notes),
  };
}
function mapCourse(row: Row): Course {
  return {
    id: text(row.id),
    courseName: text(row.course_name),
    category: text(row.category, "General"),
    duration: text(row.duration, "1 month"),
    level: text(row.level, "Beginner") as Course["level"],
    price: n(row.price),
    discount: n(row.discount),
    status: text(row.status, "draft") as Course["status"],
    description: text(row.description),
    thumbnail: row.thumbnail as string | undefined,
    students: n(row.students),
    revenue: n(row.revenue),
    completionRate: n(row.completion_rate),
  };
}
function mapPayment(row: Row): Payment {
  const e = (row.enrollments ?? {}) as Row;
  const studentName = text(e.full_name, "Student");
  return {
    id: text(row.id),
    studentId: text(row.enrollment_id),
    studentName,
    courseName: text(e.exact_program || e.course_name, "Unassigned"),
    totalFee: n(e.total_fee),
    paidAmount: n(e.paid_amount),
    amount: n(row.amount),
    paymentDate: text(row.payment_date || row.created_at),
    paymentMethod: text(row.payment_method, "Bank Transfer") as Payment["paymentMethod"],
    transactionId: text(row.reference_number),
    status: text(row.status, "pending") as Payment["status"],
    screenshotUrl: row.screenshot_url as string | undefined,
  };
}
function mapReview(row: Row): Review {
  const name = text(row.name || row.student_name, "Student");
  const moderationStatus = text(row.moderation_status, "pending");
  return {
    id: text(row.id),
    studentName: name,
    studentAvatar: text(row.student_avatar, avatar(name)),
    courseName: text(row.track || row.course_name),
    rating: n(row.rating) || 5,
    message: text(row.story || row.message),
    submittedAt: text(row.created_at),
    status: (row.approved ? "approved" : moderationStatus) as Review["status"],
    pinned: Boolean(row.pinned),
  };
}

const query = (table: string, suffix = "") => `/rest/v1/${table}?${suffix}`;
const sanitize = (obj: Row): Row => {
  const clean: Row = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) clean[k] = v;
  }
  return clean;
};
const update = async (table: string, id: string, patch: Row) =>
  supabaseRequest<Row[]>(query(table, `id=eq.${id}`), {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(sanitize(patch)),
  });

export const api = {
  dashboard: async () => {
    const [students, payments, reviews, courses] = await Promise.all([
      api.enrollments.list(),
      api.payments.list(),
      api.reviews.list(),
      api.courses.list(),
    ]);
    const verified = payments.filter((p) => p.status === "verified");
    const now = new Date();
    const metrics = {
      totalRevenue: verified.reduce((sum, p) => sum + p.amount, 0),
      monthlyRevenue: verified
        .filter(
          (p) =>
            new Date(p.paymentDate).getMonth() === now.getMonth() &&
            new Date(p.paymentDate).getFullYear() === now.getFullYear(),
        )
        .reduce((sum, p) => sum + p.amount, 0),
      totalStudents: students.length,
      activeStudents: students.filter((s) => s.admissionStatus === "confirmed").length,
      pendingAdmissions: students.filter((s) => s.admissionStatus === "pending").length,
      pendingPayments: payments.filter((p) => p.status === "pending").length,
      newEnrollmentsToday: students.filter(
        (s) => new Date(s.enrollmentDate).toDateString() === now.toDateString(),
      ).length,
      approvedReviews: reviews.filter((r) => r.status === "approved").length,
      pendingReviews: reviews.filter((r) => r.status === "pending").length,
    };
    const activities: Activity[] = [
      ...students.slice(0, 4).map((s) => ({
        id: s.id,
        type: "enrollment" as const,
        message: `${s.name} enrolled in ${s.courseName}`,
        time: formatRelativeTime(s.enrollmentDate),
      })),
      ...payments
        .filter((p) => p.status === "pending")
        .slice(0, 2)
        .map((p) => ({
          id: p.id,
          type: "payment" as const,
          message: `Payment awaiting verification for ${p.studentName}`,
          time: formatRelativeTime(p.paymentDate),
        })),
    ];
    return { metrics, activities, students, payments, reviews, courses };
  },
  enrollments: {
    list: async () =>
      (
        await supabaseRequest<Row[]>(
          query("enrollments", "select=*,payments(amount,status)&order=created_at.desc"),
        )
      ).map((row) => {
        const verified = ((row.payments ?? []) as Row[])
          .filter((p) => p.status === "verified")
          .reduce((sum, p) => sum + n(p.amount), 0);
        return mapStudent({ ...row, paid_amount: verified });
      }),
    create: async (s: Partial<Student>) => {
      const rows = await supabaseRequest<Row[]>(query("enrollments"), {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          full_name: s.name,
          email: s.email,
          whatsapp_number: s.phone,
          city_country: s.city,
          course_id: s.courseId || null,
          exact_program: s.courseName || "",
          total_fee: s.totalFee || 0,
          status: s.admissionStatus || "pending",
          government_id: s.governmentId || null,
          current_professional_profile: s.professionalProfile || "",
          terms_privacy_accepted: s.termsAccepted ?? false,
          source_track_id: s.sourceTrackId || "",
          guardian_name: s.guardian?.name || null,
          guardian_phone: s.guardian?.phone || null,
          guardian_relation: s.guardian?.relation || null,
          notes: s.notes || null,
        }),
      });
      return mapStudent(rows[0]);
    },
    update: async (id: string, patch: Partial<Student>) => {
      const row = await update("enrollments", id, {
        ...(patch.name !== undefined && { full_name: patch.name }),
        ...(patch.email !== undefined && { email: patch.email }),
        ...(patch.phone !== undefined && { whatsapp_number: patch.phone }),
        ...(patch.city !== undefined && { city_country: patch.city }),
        ...(patch.courseId !== undefined && { course_id: patch.courseId || null }),
        ...(patch.courseName !== undefined && { exact_program: patch.courseName }),
        ...(patch.totalFee !== undefined && { total_fee: patch.totalFee }),
        ...(patch.admissionStatus !== undefined && { status: patch.admissionStatus }),
        ...(patch.governmentId !== undefined && { government_id: patch.governmentId || null }),
        ...(patch.professionalProfile !== undefined && { current_professional_profile: patch.professionalProfile }),
        ...(patch.guardian?.name !== undefined && { guardian_name: patch.guardian.name }),
        ...(patch.guardian?.phone !== undefined && { guardian_phone: patch.guardian.phone }),
        ...(patch.guardian?.relation !== undefined && { guardian_relation: patch.guardian.relation }),
        ...(patch.notes !== undefined && { notes: patch.notes }),
      });
      return row[0] ? mapStudent(row[0]) : undefined;
    },
    delete: async (id: string) => {
      await supabaseRequest(query("enrollments", `id=eq.${id}`), { method: "DELETE" });
    },
    payments: async (enrollmentId: string) => {
      const rows = await supabaseRequest<Row[]>(
        query("payments", `select=*&enrollment_id=eq.${enrollmentId}&order=payment_date.desc`),
      );
      return rows.map((row) => mapPayment({
        ...row,
        enrollments: { paid_amount: 0 },
      }));
    },
  },
  payments: {
    list: async () => {
      const rows = await supabaseRequest<Row[]>(
        query(
          "payments",
          "select=*,enrollments(full_name,exact_program,total_fee)&order=payment_date.desc",
        ),
      );
      const verifiedByEnrollment = new Map<string, number>();
      rows
        .filter((row) => row.status === "verified")
        .forEach((row) => {
          const id = text(row.enrollment_id);
          verifiedByEnrollment.set(id, (verifiedByEnrollment.get(id) ?? 0) + n(row.amount));
        });
      return rows.map((row) =>
        mapPayment({
          ...row,
          enrollments: {
            ...((row.enrollments ?? {}) as Row),
            paid_amount: verifiedByEnrollment.get(text(row.enrollment_id)) ?? 0,
          },
        }),
      );
    },
    update: async (id: string, patch: Partial<Payment>) => {
      const row = await update("payments", id, {
        ...(patch.status !== undefined && { status: patch.status }),
      });
      return row[0] ? mapPayment(row[0]) : undefined;
    },
    create: async (p: Payment) => {
      const rows = await supabaseRequest<Row[]>(query("payments"), {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          enrollment_id: p.studentId,
          amount: p.amount,
          payment_date: p.paymentDate,
          payment_method: p.paymentMethod,
          reference_number: p.transactionId,
          status: p.status,
          screenshot_url: p.screenshotUrl,
        }),
      });
      return mapPayment(rows[0]);
    },
  },
  reviews: {
    list: async () =>
      (await supabaseRequest<Row[]>(query("feedbacks", "select=*&order=created_at.desc"))).map(
        mapReview,
      ),
    update: async (id: string, patch: Partial<Review>) => {
      const row = await update("feedbacks", id, {
        ...(patch.status !== undefined && { approved: patch.status === "approved", moderation_status: patch.status }),
        ...(patch.pinned !== undefined && { pinned: patch.pinned }),
      });
      return row[0] ? mapReview(row[0]) : undefined;
    },
    delete: async (id: string) => {
      await supabaseRequest(query("feedbacks", `id=eq.${id}`), { method: "DELETE" });
    },
  },
  courses: {
    list: async () =>
      (await supabaseRequest<Row[]>(query("courses", "select=*&order=created_at.desc"))).map(
        mapCourse,
      ),
    create: async (c: Course) => {
      const rows = await supabaseRequest<Row[]>(query("courses"), {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          course_name: c.courseName,
          category: c.category,
          duration: c.duration,
          level: c.level,
          price: c.price,
          discount: c.discount,
          status: c.status,
          description: c.description,
        }),
      });
      return mapCourse(rows[0]);
    },
    update: async (id: string, c: Partial<Course>) => {
      const rows = await update("courses", id, {
        ...(c.courseName !== undefined && { course_name: c.courseName }),
        ...(c.category !== undefined && { category: c.category }),
        ...(c.duration !== undefined && { duration: c.duration }),
        ...(c.level !== undefined && { level: c.level }),
        ...(c.price !== undefined && { price: c.price }),
        ...(c.discount !== undefined && { discount: c.discount }),
        ...(c.status !== undefined && { status: c.status }),
        ...(c.description !== undefined && { description: c.description }),
      });
      return rows[0] ? mapCourse(rows[0]) : undefined;
    },
    delete: async (id: string) => {
      await supabaseRequest(query("courses", `id=eq.${id}`), { method: "DELETE" });
    },
  },
};
