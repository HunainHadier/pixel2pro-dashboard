import { generateSlip, openSlipTab } from "@/lib/slip";

export { openSlipTab };

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
  type?: "admission" | "monthly" | "installment" | "one-time";
  monthlyFee?: number;
  months?: number;
}): Promise<string> {
  return generateSlip({
    ...data,
    type: data.type ?? "monthly",
  });
}
