import { uploadToStorage } from "@/lib/supabase";

export interface SlipData {
  studentName: string;
  courseName: string;
  amount: number;
  totalFee: number;
  paidAmount: number;
  paymentMethod: string;
  transactionId: string;
  paymentDate: string;
  status: string;
  type: "admission" | "monthly";
  slipId: string;
  monthlyFee?: number;
  months?: number;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPKR(v: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(v);
}

const LOGO_URL = "/logo.png";

function buildSlipHtml(data: SlipData) {
  const remaining = Math.max(0, data.totalFee - data.paidAmount);
  const title =
    data.type === "admission" ? "Admission Fee Payment Slip" : "Monthly Fee Payment Slip";
  const slipRef = data.type === "admission" ? `ADM-FEE-${data.slipId}` : `MTH-FEE-${data.slipId}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${title} - ${slipRef}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #e5e5e5; padding: 20px; }
  .slip { max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #d4d4d4; }
  .header { padding: 28px 32px 22px; border-bottom: 3px solid #111; text-align: center; }
  .header .logo { height: 72px; width: auto; object-fit: contain; display: inline-block; }
  .header h1 { font-size: 16px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 16px; color: #111; }
  .header .divider { width: 44px; height: 3px; background: #111; margin: 12px auto 14px; }
  .header .slip-ref { display: inline-block; background: #111; color: #fff; padding: 6px 18px; font-size: 11px; letter-spacing: 1.5px; font-weight: 600; }
  .body { padding: 24px 32px 10px; }
  .row { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid #e4e4e4; }
  .row:last-child { border-bottom: none; }
  .label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; }
  .value { font-size: 14px; font-weight: 600; color: #111; text-align: right; }
  .amount-box { border: 2px solid #111; padding: 22px; margin: 22px 0 18px; text-align: center; background: #fff; }
  .amount-box .amount { font-size: 34px; font-weight: 800; color: #111; }
  .amount-box .label { color: #6b7280; margin-top: 2px; }
  .type-badge, .status-badge { display: inline-block; padding: 3px 12px; border: 1px solid #111; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background: #fff; color: #111; }
  .status-verified { background: #111; color: #fff; }
  .status-rejected { border-style: dashed; background: #fff; color: #111; }
  .summary { background: #f7f7f7; border-left: 3px solid #111; padding: 4px 14px; margin-top: 18px; }
  .summary .row { padding: 9px 0; border-color: #e0e0e0; }
  .footer { background: #fafafa; padding: 18px 32px; text-align: center; border-top: 1px solid #e0e0e0; }
  .footer p { font-size: 11px; color: #9ca3af; }
  .footer .brand { font-weight: 700; color: #111; }
  @media print { body { background: #fff; padding: 0; } .slip { border: none; } .no-print { display: none !important; } }
</style>
</head>
<body>
<div class="slip">
  <div class="header">
    <img class="logo" src="${LOGO_URL}" alt="Pixel2Pro" />
    <h1>${title}</h1>
    <div class="divider"></div>
    <div class="slip-ref">${slipRef}</div>
  </div>
  <div class="body">
    <div class="row"><div class="label">Student Name</div><div class="value">${data.studentName}</div></div>
    <div class="row"><div class="label">Course</div><div class="value">${data.courseName}</div></div>
    <div class="row"><div class="label">Payment Date</div><div class="value">${formatDate(data.paymentDate)}</div></div>
    <div class="row"><div class="label">Payment Method</div><div class="value">${data.paymentMethod}</div></div>
    <div class="row"><div class="label">Reference / Transaction ID</div><div class="value" style="font-family:monospace;font-size:12px;">${data.transactionId}</div></div>
    <div class="row"><div class="label">Payment Type</div><div class="value"><span class="type-badge">${data.type === "admission" ? "Admission Fee" : "Monthly Fee"}</span></div></div>
    <div class="row"><div class="label">Status</div><div class="value"><span class="status-badge status-${data.status}">${data.status}</span></div></div>

    <div class="amount-box">
      <div class="amount">${formatPKR(data.amount)}</div>
      <div class="label">Amount Paid</div>
    </div>

    <div class="summary">
      ${data.monthlyFee && data.months ? `<div class="row"><div class="label">Monthly Fee (${data.months} month${data.months > 1 ? "s" : ""})</div><div class="value">${formatPKR(data.monthlyFee)} × ${data.months}</div></div>` : ""}
      <div class="row"><div class="label">Total Course Fee</div><div class="value">${formatPKR(data.totalFee)}</div></div>
      <div class="row"><div class="label">Total Paid</div><div class="value">${formatPKR(data.paidAmount)}</div></div>
      <div class="row"><div class="label">Remaining Balance</div><div class="value">${formatPKR(remaining)}</div></div>
    </div>
  </div>
  <div class="footer">
    <p>This is a computer-generated slip. No signature required.</p>
    <p style="margin-top:8px"><span class="brand">Pixel2Pro</span></p>
  </div>
</div>
<div class="no-print" style="max-width:600px;margin:20px auto;text-align:center;">
  <button onclick="window.print()" style="padding:10px 28px;background:#111827;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-weight:600;">Print / Save as PDF</button>
  <button onclick="window.close()" style="padding:10px 28px;background:#e5e7eb;color:#374151;border:none;border-radius:8px;font-size:14px;cursor:pointer;margin-left:8px;">Close</button>
</div>
</body>
</html>`;
}

export async function generateSlip(
  data: Omit<SlipData, "slipId"> & { slipId?: string },
): Promise<string> {
  const slipId = data.slipId || Date.now().toString(36).toUpperCase();
  const full: SlipData = { ...data, slipId };

  const html = buildSlipHtml(full);

  // Popup blockers often kill window.open when it's called after an async/network
  // roundtrip (e.g. from onSuccess). Open the preview if allowed, otherwise fall back
  // to downloading the slip file so generation never silently fails.
  const w = window.open("", "_blank", "width=650,height=800");
  if (w) {
    w.document.write(html);
    w.document.close();
  } else {
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${slipId}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const blob = new Blob([html], { type: "text/html" });
  const file = new File([blob], `${slipId}.html`, { type: "text/html" });
  try {
    const url = await uploadToStorage(file, `${slipId}.html`);
    return url || "";
  } catch (err) {
    console.warn("Slip storage upload failed:", err);
    return "";
  }
}
