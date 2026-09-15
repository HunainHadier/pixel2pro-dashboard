export type AdmissionStatus = "pending" | "confirmed" | "rejected" | "completed" | "suspended";
export type FeeStatus = "unpaid" | "partial" | "paid" | "overdue";
export type PaymentStatus = "pending" | "verified" | "rejected";
export type PaymentMethod = "JazzCash" | "EasyPaisa" | "Bank Transfer" | "Cash" | "Card";
export type ReviewStatus = "pending" | "approved" | "rejected";

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
  paymentType: "admission" | "monthly";
}

export interface Review {
  id: string;
  studentName: string;
  studentAvatar: string;
  courseName: string;
  rating: number;
  message: string;
  videoUrl?: string;
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