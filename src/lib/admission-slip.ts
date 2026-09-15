import { generateSlip } from "@/lib/slip";

export async function generateAdmissionSlip(data: { studentName: string; email: string; phone: string; city: string; courseName: string; totalFee: number; status: string; governmentId?: string; guardianName?: string; guardianPhone?: string; monthlyFee?: number; months?: number; }): Promise<string> {
  return generateSlip({
    studentName: data.studentName,
    courseName: data.courseName,
    amount: 0,
    totalFee: data.totalFee,
    paidAmount: 0,
    paymentMethod: "Admission",
    transactionId: `ADM-${Date.now().toString(36).toUpperCase()}`,
    paymentDate: new Date().toISOString(),
    status: data.status === "confirmed" ? "verified" : data.status === "rejected" ? "rejected" : "pending",
    type: "admission",
    monthlyFee: data.monthlyFee,
    months: data.months,
  });
}