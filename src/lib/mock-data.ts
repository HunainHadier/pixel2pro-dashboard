export type AdmissionStatus = "pending" | "confirmed" | "rejected" | "completed" | "suspended";
export type FeeStatus = "unpaid" | "partial" | "paid" | "overdue";
export type PaymentStatus = "pending" | "verified" | "rejected";
export type PaymentMethod = "JazzCash" | "EasyPaisa" | "Bank Transfer" | "Cash" | "Card";
export type ReviewStatus = "pending" | "approved" | "rejected";
export type FeePlanType = "monthly" | "lump-sum" | "installment";

export const PROFESSIONAL_PROFILES = [
  "Student (CS / IT / Engineering)",
  "Student (Non-Tech / Business / Arts)",
  "Working Professional (Developer / Marketer / Corporate Employee)",
  "Freelancer / Remote Operator",
  "Business Owner / Agency Founder",
  "Teacher / Educator / Academic Administrator",
  "Unemployed / Seeking Transition",
] as const;

export interface FeeInstallment {
  label: string;
  amount: number;
  note?: string;
}

export interface FeePlan {
  id: string;
  type: FeePlanType;
  title: string;
  totalFee: number;
  registrationFee: number;
  monthlyFee?: number;
  months?: number;
  installments?: FeeInstallment[];
  badge?: string;
  note?: string;
}

export interface Course {
  id: string;
  courseName: string;
  category: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  price: number;
  discount: number;
  status: "published" | "draft";
  description: string;
  thumbnail?: string;
  imageUrl?: string;
  showOnHome?: boolean;
  homeOrder?: number;
  students: number;
  revenue: number;
  completionRate: number;
  classesPerWeek: number;
  hoursPerClass: number;
  admissionFee?: number;
  monthlyFee: number;
  itDiscountMonthlyFee?: number;
  itDiscountRegistrationFee?: number;
  feePlans?: FeePlan[];
  track?: string;
  programName?: string;
  sessions?: string;
  instructor?: string;
  instructorRole?: string;
  overview?: string;
  outcomes?: string[];
  tools?: string[];
  industryTrends?: string[];
  curriculum?: { week: string; title: string; lessons: string[] }[];
  impactHeadline?: string;
  impactMetrics?: { value: string; label: string }[];
}

export interface Student {
  id: string;
  name: string;
  avatar: string;
  email: string;
  phone: string;
  city: string;
  courseId: string;
  courseName: string;
  enrollmentDate: string;
  admissionStatus: AdmissionStatus;
  feeStatus: FeeStatus;
  totalFee: number;
  paidAmount: number;
  courseMonthlyFee?: number;
  courseMonths?: number;
  feePlanId?: string;
  governmentId?: string;
  professionalProfile?: string;
  termsAccepted: boolean;
  sourceTrackId?: string;
  guardian?: { name: string; phone: string; relation: string };
  documents?: { name: string; url: string }[];
  notes?: string;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  courseName: string;
  totalFee: number;
  paidAmount: number;
  courseMonthlyFee?: number;
  courseMonths?: number;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionId: string;
  status: PaymentStatus;
  screenshotUrl?: string;
  slipUrl?: string;
  paymentType: "admission" | "monthly" | "installment" | "one-time";
  paymentTypeDowngraded?: boolean;
}

export interface Review {
  id: string;
  studentName: string;
  studentAvatar: string;
  courseName: string;
  rating: number;
  message: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  submittedAt: string;
  status: ReviewStatus;
  pinned?: boolean;
}

export interface Activity {
  id: string;
  type: "enrollment" | "payment" | "review" | "admission";
  message: string;
  time: string;
}

// Utility functions for formatting
export function formatPKR(n: number) {
  return "PKR " + n.toLocaleString("en-PK");
}

export function formatPKRShort(n: number) {
  if (n >= 1000000) return `PKR ${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `PKR ${(n / 1000).toFixed(0)}K`;
  return `PKR ${n}`;
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function paymentTypeLabel(type: Payment["paymentType"]): string {
  switch (type) {
    case "admission":
      return "Admission";
    case "monthly":
      return "Monthly";
    case "installment":
      return "Installment";
    case "one-time":
      return "One-Time";
  }
}

// ---------------------------------------------------------------------------
// Fee policy: the current payment structure for every program.
// Every program: 5,000/month + 5,000 admission.
// Next-Gen Developer (4 months): lump-sum 16,000 (reg 0) | 2 installments 18,000 (reg 2,000)
// AI Foundation (2 months):        lump-sum 8,000 (reg 0)   | monthly 5,000/month + 5,000 reg
// Digital Marketing (3 months):    lump-sum 12,000 (reg 0)  | 2 installments 16,000 (reg 2,000)
// Shopify (2 months):              lump-sum 8,000 (reg 0)   | monthly 5,000/month + 5,000 reg
// ---------------------------------------------------------------------------
const NEXTGEN_PLANS: FeePlan[] = [
  {
    id: "monthly",
    type: "monthly",
    title: "Monthly Fee",
    totalFee: 25000,
    registrationFee: 5000,
    monthlyFee: 5000,
    months: 4,
  },
  {
    id: "lump-sum",
    type: "lump-sum",
    title: "One-Time Payment",
    totalFee: 16000,
    registrationFee: 0,
    badge: "Best Value",
    note: "No registration fee",
  },
  {
    id: "installment",
    type: "installment",
    title: "2 Installments",
    totalFee: 18000,
    registrationFee: 2000,
    badge: "Flexible",
    installments: [
      {
        label: "Before course starts",
        amount: 10000,
        note: "Course fee 8,000 + registration 2,000",
      },
      { label: "Start of 2nd month", amount: 8000 },
    ],
  },
];

const AI_PLANS: FeePlan[] = [
  {
    id: "monthly",
    type: "monthly",
    title: "Monthly Fee",
    totalFee: 15000,
    registrationFee: 5000,
    monthlyFee: 5000,
    months: 2,
  },
  {
    id: "lump-sum",
    type: "lump-sum",
    title: "One-Time Payment",
    totalFee: 8000,
    registrationFee: 0,
    badge: "Best Value",
    note: "No registration fee",
  },
];

const DIGITAL_PLANS: FeePlan[] = [
  {
    id: "monthly",
    type: "monthly",
    title: "Monthly Fee",
    totalFee: 20000,
    registrationFee: 5000,
    monthlyFee: 5000,
    months: 3,
  },
  {
    id: "lump-sum",
    type: "lump-sum",
    title: "One-Time Payment",
    totalFee: 12000,
    registrationFee: 0,
    badge: "Best Value",
    note: "No registration fee",
  },
  {
    id: "installment",
    type: "installment",
    title: "2 Installments",
    totalFee: 16000,
    registrationFee: 2000,
    badge: "Flexible",
    installments: [
      { label: "Before course starts", amount: 9000 },
      { label: "Start of 2nd month", amount: 7000 },
    ],
  },
];

const SHOPIFY_PLANS: FeePlan[] = [
  {
    id: "monthly",
    type: "monthly",
    title: "Monthly Fee",
    totalFee: 15000,
    registrationFee: 5000,
    monthlyFee: 5000,
    months: 2,
  },
  {
    id: "lump-sum",
    type: "lump-sum",
    title: "One-Time Payment",
    totalFee: 8000,
    registrationFee: 0,
    badge: "Best Value",
    note: "No registration fee",
  },
];

const normalizePlanKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export function defaultFeePlansFor(
  courseName: string,
  months = 1,
  monthlyFee = 0,
  admissionFee = 0,
): FeePlan[] {
  const key = normalizePlanKey(courseName);
  if (key.includes("next")) return NEXTGEN_PLANS;
  if (key.includes("digital")) return DIGITAL_PLANS;
  if (key.startsWith("ai") || key.includes("freelanc")) return AI_PLANS;
  if (key.includes("shopify")) return SHOPIFY_PLANS;
  if (monthlyFee > 0) {
    return [
      {
        id: "monthly",
        type: "monthly",
        title: "Monthly Fee",
        totalFee: monthlyFee * months + admissionFee,
        registrationFee: admissionFee,
        monthlyFee,
        months,
      },
    ];
  }
  return [];
}

export function parseFeePlans(raw: unknown): FeePlan[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const valid = raw.filter(
    (p): p is FeePlan =>
      !!p &&
      typeof p === "object" &&
      typeof (p as FeePlan).type === "string" &&
      ["monthly", "lump-sum", "installment"].includes((p as FeePlan).type) &&
      typeof (p as FeePlan).totalFee === "number",
  );
  return valid.length ? valid : undefined;
}

export function getFeePlans(
  course:
    | Pick<Partial<Course>, "courseName" | "duration" | "monthlyFee" | "admissionFee" | "feePlans">
    | undefined,
): FeePlan[] {
  if (!course) return [];
  if (course.feePlans && course.feePlans.length) return course.feePlans;
  const months = parseInt(course.duration || "") || 1;
  return defaultFeePlansFor(
    course.courseName || "",
    months,
    course.monthlyFee || 0,
    course.admissionFee ?? 0,
  );
}

export function resolveStudentFeePlan(
  student: Pick<Student, "feePlanId" | "totalFee">,
  course: Pick<
    Partial<Course>,
    "courseName" | "duration" | "monthlyFee" | "admissionFee" | "feePlans"
  >,
): FeePlan | undefined {
  const plans = getFeePlans(course);
  return (
    plans.find((p) => p.id === student.feePlanId) ??
    plans.find((p) => p.totalFee === student.totalFee) ??
    plans.find((p) => p.type === "lump-sum") ??
    plans[0]
  );
}

export function admissionInfo(
  student: Pick<Student, "paidAmount">,
  plan: FeePlan | undefined,
  hasSeparateAdmissionPayment: boolean,
  recordedAmount?: number,
): { paid: boolean; applicable: boolean; label: string } {
  if (!plan || plan.type === "monthly") {
    return {
      paid: hasSeparateAdmissionPayment,
      applicable: true,
      label: hasSeparateAdmissionPayment ? "Admission: ✓ Paid" : "Admission: Not paid",
    };
  }
  if (plan.type === "installment") {
    const covered =
      Math.max(recordedAmount ?? 0, student.paidAmount ?? 0) >= (plan.registrationFee ?? 0);
    return {
      paid: covered,
      applicable: true,
      label: covered
        ? "Admission: ✓ Paid (inside Installment 1)"
        : "Admission: Pending (inside Installment 1)",
    };
  }
  return { paid: true, applicable: false, label: "Admission: ✓ Paid (included in one-time fee)" };
}

export interface FeeSettings {
  lumpSumTotal: number;
  installmentEnabled: boolean;
  installmentRegistration: number;
  installments: FeeInstallment[];
}

export function feeSettingsFromPlans(plans: FeePlan[] | undefined): FeeSettings {
  const lump = (plans ?? []).find((p) => p.type === "lump-sum");
  const inst = (plans ?? []).find((p) => p.type === "installment");
  return {
    lumpSumTotal: lump?.totalFee ?? 0,
    installmentEnabled: !!inst,
    installmentRegistration: inst?.registrationFee ?? 0,
    installments: inst?.installments ?? [],
  };
}

export function feePlansFromSettings(
  s: FeeSettings,
  monthlyFee: number,
  admissionFee: number,
  months: number,
): FeePlan[] {
  const plans: FeePlan[] = [];
  const monthlyTotal = monthlyFee * months + admissionFee;
  plans.push({
    id: "monthly",
    type: "monthly",
    title: "Monthly Fee",
    totalFee: monthlyTotal,
    registrationFee: admissionFee,
    monthlyFee,
    months,
  });
  if (s.lumpSumTotal > 0) {
    plans.push({
      id: "lump-sum",
      type: "lump-sum",
      title: "One-Time Payment",
      totalFee: s.lumpSumTotal,
      registrationFee: 0,
      badge: "Best Value",
      note: "No registration fee",
    });
  }
  if (s.installmentEnabled && s.installments.length > 0) {
    const courseTotal = s.installments.reduce(
      (sum, i) => sum + Math.max(0, Number(i.amount) || 0),
      0,
    );
    plans.push({
      id: "installment",
      type: "installment",
      title: `${s.installments.length} Installments`,
      totalFee: courseTotal,
      registrationFee: s.installmentRegistration,
      badge: "Flexible",
      installments: s.installments,
    });
  }
  return plans;
}
