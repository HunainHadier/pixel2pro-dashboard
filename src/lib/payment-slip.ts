interface SlipData {
  studentName: string;
  courseName: string;
  amount: number;
  totalFee: number;
  paidAmount: number;
  paymentMethod: string;
  transactionId: string;
  paymentDate: string;
  status: string;
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
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(v);
}

export function generatePaymentSlip(data: SlipData) {
  const remaining = data.totalFee - data.paidAmount;
  const slipId = `P2P-${Date.now().toString(36).toUpperCase()}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Payment Receipt - ${slipId}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #f5f5f5; padding: 20px; }
  .receipt { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 20px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #111827, #374151); color: #fff; padding: 32px; text-align: center; }
  .header h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
  .header p { font-size: 12px; opacity: 0.7; margin-top: 4px; }
  .header .receipt-id { margin-top: 12px; display: inline-block; background: rgba(255,255,255,0.15); padding: 4px 14px; border-radius: 20px; font-size: 11px; letter-spacing: 1px; }
  .body { padding: 28px 32px; }
  .row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
  .row:last-child { border-bottom: none; }
  .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
  .value { font-size: 14px; font-weight: 600; color: #111827; text-align: right; }
  .amount-box { background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
  .amount-box .amount { font-size: 32px; font-weight: 800; color: #16a34a; }
  .amount-box .label { color: #16a34a; margin-top: 4px; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
  .status-pending { background: #fef3c7; color: #92400e; }
  .status-verified { background: #d1fae5; color: #065f46; }
  .status-rejected { background: #fee2e2; color: #991b1b; }
  .footer { background: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb; }
  .footer p { font-size: 11px; color: #9ca3af; }
  .footer .brand { font-weight: 700; color: #374151; }
  @media print { body { background: #fff; padding: 0; } .receipt { box-shadow: none; } .no-print { display: none !important; } }
</style>
</head>
<body>
<div class="receipt">
  <div class="header">
    <h1>Pixel2Pro</h1>
    <p>Payment Receipt</p>
    <div class="receipt-id">${slipId}</div>
  </div>
  <div class="body">
    <div class="row"><div class="label">Student Name</div><div class="value">${data.studentName}</div></div>
    <div class="row"><div class="label">Course</div><div class="value">${data.courseName}</div></div>
    <div class="row"><div class="label">Payment Date</div><div class="value">${formatDate(data.paymentDate)}</div></div>
    <div class="row"><div class="label">Payment Method</div><div class="value">${data.paymentMethod}</div></div>
    <div class="row"><div class="label">Reference / Transaction ID</div><div class="value" style="font-family:monospace;font-size:12px;">${data.transactionId}</div></div>
    <div class="row"><div class="label">Status</div><div class="value"><span class="status-badge status-${data.status}">${data.status}</span></div></div>

    <div class="amount-box">
      <div class="amount">${formatPKR(data.amount)}</div>
      <div class="label">Amount Paid</div>
    </div>

    <div class="row"><div class="label">Total Course Fee</div><div class="value">${formatPKR(data.totalFee)}</div></div>
    <div class="row"><div class="label">Total Paid</div><div class="value">${formatPKR(data.paidAmount + data.amount)}</div></div>
    <div class="row"><div class="label">Remaining Balance</div><div class="value" style="color:${remaining > 0 ? '#dc2626' : '#16a34a'};">${formatPKR(Math.max(0, remaining))}</div></div>
  </div>
  <div class="footer">
    <p>This is a computer-generated receipt. No signature required.</p>
    <p style="margin-top:8px"><span class="brand">Pixel2Pro</span> · Pixel Today, Pro Tomorrow</p>
  </div>
</div>
<div class="no-print" style="max-width:600px;margin:20px auto;text-align:center;">
  <button onclick="window.print()" style="padding:10px 28px;background:#111827;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-weight:600;">Print / Save as PDF</button>
  <button onclick="window.close()" style="padding:10px 28px;background:#e5e7eb;color:#374151;border:none;border-radius:8px;font-size:14px;cursor:pointer;margin-left:8px;">Close</button>
</div>
</body>
</html>`;

  const w = window.open("", "_blank", "width=650,height=800");
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}
