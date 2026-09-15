import { generateSlip } from "@/lib/slip";

export async function generatePaymentSlip(data: {
  studentName: string;
  courseName: string;
  amount: number;
  totalFee: number;
  paidAmount: number;
  paymentMethod: string;
  transactionId: string;
  paymentDate: string;
  status: string;
  type?: "admission" | "monthly";
  monthlyFee?: number;
  months?: number;
}): Promise<string> {
  return generateSlip({
    ...data,
    type: data.type ?? "monthly",
  });
}