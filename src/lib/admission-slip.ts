interface AdmissionSlipData {
  studentName: string;
  email: string;
  phone: string;
  city: string;
  courseName: string;
  totalFee: number;
  status: string;
  governmentId?: string;
  guardianName?: string;
  guardianPhone?: string;
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

export function generateAdmissionSlip(data: AdmissionSlipData) {
  const slipId = `ADM-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();
  const statusColor = data.status === "confirmed" ? "#16a34a" : data.status === "rejected" ? "#dc2626" : "#d97706";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Admission Confirmation - ${slipId}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #f5f5f5; padding: 20px; }
  .slip { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 20px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #111827, #374151); color: #fff; padding: 32px; text-align: center; }
  .header h1 { font-size: 22px; font-weight: 700; }
  .header p { font-size: 12px; opacity: 0.7; margin-top: 4px; }
  .header .slip-id { margin-top: 12px; display: inline-block; background: rgba(255,255,255,0.15); padding: 4px 14px; border-radius: 20px; font-size: 11px; letter-spacing: 1px; }
  .body { padding: 28px 32px; }
  .row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
  .row:last-child { border-bottom: none; }
  .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
  .value { font-size: 14px; font-weight: 600; color: #111827; text-align: right; max-width: 60%; word-break: break-word; }
  .status-box { text-align: center; padding: 20px; margin: 16px 0; border-radius: 12px; border: 2px solid ${statusColor}; background: ${statusColor}08; }
  .status-box .status-text { font-size: 18px; font-weight: 800; color: ${statusColor}; text-transform: uppercase; }
  .section-title { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin: 20px 0 8px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
  .footer { background: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb; }
  .footer p { font-size: 11px; color: #9ca3af; }
  .footer .brand { font-weight: 700; color: #374151; }
  @media print { body { background: #fff; padding: 0; } .slip { box-shadow: none; } .no-print { display: none !important; } }
</style>
</head>
<body>
<div class="slip">
  <div class="header">
    <h1>Pixel2Pro</h1>
    <p>Admission Confirmation</p>
    <div class="slip-id">${slipId}</div>
  </div>
  <div class="body">
    <div class="status-box">
      <div class="status-text">${data.status === "confirmed" ? "Admission Confirmed" : data.status === "rejected" ? "Admission Rejected" : "Admission Pending"}</div>
    </div>

    <div class="section-title">Student Information</div>
    <div class="row"><div class="label">Full Name</div><div class="value">${data.studentName}</div></div>
    <div class="row"><div class="label">Email</div><div class="value">${data.email}</div></div>
    <div class="row"><div class="label">Phone</div><div class="value">${data.phone}</div></div>
    <div class="row"><div class="label">City</div><div class="value">${data.city}</div></div>
    ${data.governmentId ? `<div class="row"><div class="label">Government ID</div><div class="value" style="font-family:monospace;font-size:12px;">${data.governmentId}</div></div>` : ""}

    <div class="section-title">Course Details</div>
    <div class="row"><div class="label">Course</div><div class="value">${data.courseName}</div></div>
    <div class="row"><div class="label">Total Fee</div><div class="value">${formatPKR(data.totalFee)}</div></div>

    ${data.guardianName ? `
    <div class="section-title">Guardian Information</div>
    <div class="row"><div class="label">Guardian Name</div><div class="value">${data.guardianName}</div></div>
    ${data.guardianPhone ? `<div class="row"><div class="label">Guardian Phone</div><div class="value">${data.guardianPhone}</div></div>` : ""}
    ` : ""}

    <div class="section-title">Confirmation Details</div>
    <div class="row"><div class="label">Confirmed On</div><div class="value">${formatDate(now)}</div></div>
    <div class="row"><div class="label">Slip ID</div><div class="value" style="font-family:monospace;font-size:12px;">${slipId}</div></div>
  </div>
  <div class="footer">
    <p>This is a computer-generated admission confirmation slip.</p>
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
