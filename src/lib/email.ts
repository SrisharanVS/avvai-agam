import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const FROM_EMAIL = `"Avvai Iyarkai Agam" <${process.env.EMAIL_USER}>`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendInvoiceEmail({
  to,
  customerName,
  invoiceNumber,
  totalAmount,
  pdfBuffer,
  orderId,
}: {
  to: string;
  customerName: string;
  invoiceNumber: string;
  totalAmount: number;
  pdfBuffer?: Buffer;
  orderId?: string;
}) {
  const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice from Avvai</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#F5F0E8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2D5016,#4A7C2F);padding:40px;text-align:center;">
            <h1 style="color:#F5F0E8;margin:0;font-size:32px;font-weight:700;letter-spacing:-1px;">🌿 Avvai</h1>
            <p style="color:#B8D4A0;margin:8px 0 0;font-size:14px;letter-spacing:2px;text-transform:uppercase;">Pure Food. Naturally Yours.</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="color:#4A5568;font-size:16px;margin:0 0 16px;">Dear <strong style="color:#2D5016;">${customerName}</strong>,</p>
            <p style="color:#4A5568;font-size:15px;line-height:1.6;margin:0 0 24px;">
              Thank you for your order! Please find your invoice attached to this email.
            </p>
            
            <!-- Invoice Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;border-radius:12px;padding:24px;margin-bottom:24px;">
              <tr>
                <td>
                  <p style="margin:0 0 8px;color:#718096;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Invoice Number</p>
                  <p style="margin:0 0 16px;color:#2D5016;font-size:20px;font-weight:700;">${invoiceNumber}</p>
                  <p style="margin:0 0 8px;color:#718096;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Total Amount</p>
                  <p style="margin:0;color:#2D5016;font-size:28px;font-weight:700;">₹${totalAmount.toFixed(2)}</p>
                </td>
              </tr>
            </table>

            ${orderId
      ? `<p style="margin:0 0 24px;">
              <a href="${APP_URL}/checkout/success?orderId=${orderId}" 
                 style="display:inline-block;background:#2D5016;color:#F5F0E8;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
                View Order Details
              </a>
            </p>`
      : ""
    }

            <p style="color:#718096;font-size:14px;line-height:1.6;margin:0 0 8px;">
              If you have any questions about your order, feel free to contact us:
            </p>
            <p style="margin:0;">
              <a href="mailto:support@avvai.in" style="color:#2D5016;font-weight:600;">support@avvai.in</a>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#2D5016;padding:24px;text-align:center;">
            <p style="color:#B8D4A0;margin:0;font-size:13px;">© 2024 Avvai Iyarkai Agam. All rights reserved.</p>
            <p style="color:#6B9E4A;margin:8px 0 0;font-size:12px;">Pure Food. Naturally Yours.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const attachments = pdfBuffer
    ? [
      {
        filename: `${invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ]
    : [];

  const result = await transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: `Your Invoice ${invoiceNumber} from Avvai`,
    html: emailHtml,
    attachments,
  });

  return result;
}

export async function sendOrderConfirmationEmail({
  to,
  customerName,
  orderNumber,
  totalAmount,
  items,
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  totalAmount: number;
  items: Array<{ productName: string; quantity: number; total: number }>;
}) {
  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #EDF2F7;color:#4A5568;">${item.productName}</td>
      <td style="padding:12px;border-bottom:1px solid #EDF2F7;color:#4A5568;text-align:center;">${item.quantity}</td>
      <td style="padding:12px;border-bottom:1px solid #EDF2F7;color:#2D5016;text-align:right;font-weight:600;">₹${item.total.toFixed(2)}</td>
    </tr>`
    )
    .join("");

  const emailHtml = `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#F5F0E8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#2D5016,#4A7C2F);padding:40px;text-align:center;">
          <h1 style="color:#F5F0E8;margin:0;font-size:32px;">🌿 Avvai</h1>
          <p style="color:#B8D4A0;margin:8px 0 0;font-size:14px;">Order Confirmed!</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="color:#4A5568;font-size:16px;">Dear <strong>${customerName}</strong>, your order has been placed successfully!</p>
          <p style="color:#718096;font-size:14px;">Order Number: <strong style="color:#2D5016;">${orderNumber}</strong></p>
          <table width="100%" style="border-collapse:collapse;margin:24px 0;">
            <tr style="background:#F5F0E8;">
              <th style="padding:12px;text-align:left;color:#4A5568;font-size:13px;">Product</th>
              <th style="padding:12px;text-align:center;color:#4A5568;font-size:13px;">Qty</th>
              <th style="padding:12px;text-align:right;color:#4A5568;font-size:13px;">Amount</th>
            </tr>
            ${itemsHtml}
          </table>
          <p style="font-size:20px;font-weight:700;color:#2D5016;text-align:right;">Total: ₹${totalAmount.toFixed(2)}</p>
          <p style="color:#718096;font-size:14px;">We'll notify you when your order is shipped. Thank you for choosing Avvai!</p>
        </td></tr>
        <tr><td style="background:#2D5016;padding:24px;text-align:center;">
          <p style="color:#B8D4A0;margin:0;font-size:13px;">© 2024 Avvai Iyarkai Agam</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return await transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: `Order Confirmed — ${orderNumber} | Avvai`,
    html: emailHtml,
  });
}

export async function sendPurchaseOrderEmail({
  to,
  supplierName,
  poNumber,
  totalAmount,
  pdfBuffer,
}: {
  to: string;
  supplierName: string;
  poNumber: string;
  totalAmount: number;
  pdfBuffer?: Buffer;
}) {
  const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Purchase Order from Avvai</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#F5F0E8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#2D5016,#4A7C2F);padding:40px;text-align:center;">
            <h1 style="color:#F5F0E8;margin:0;font-size:32px;font-weight:700;">🌿 Avvai</h1>
            <p style="color:#B8D4A0;margin:8px 0 0;font-size:14px;letter-spacing:2px;text-transform:uppercase;">Purchase Order</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="color:#4A5568;font-size:16px;margin:0 0 16px;">Dear <strong style="color:#2D5016;">${supplierName}</strong>,</p>
            <p style="color:#4A5568;font-size:15px;line-height:1.6;margin:0 0 24px;">
              Please find attached our Purchase Order. Kindly review and confirm receipt.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;border-radius:12px;padding:24px;margin-bottom:24px;">
              <tr>
                <td>
                  <p style="margin:0 0 8px;color:#718096;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Purchase Order Number</p>
                  <p style="margin:0 0 16px;color:#2D5016;font-size:20px;font-weight:700;">${poNumber}</p>
                  <p style="margin:0 0 8px;color:#718096;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Total Amount</p>
                  <p style="margin:0;color:#2D5016;font-size:28px;font-weight:700;">₹${totalAmount.toFixed(2)}</p>
                </td>
              </tr>
            </table>
            <p style="color:#718096;font-size:14px;line-height:1.6;">
              For any queries, contact us at <a href="mailto:support@avvai.in" style="color:#2D5016;font-weight:600;">support@avvai.in</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#2D5016;padding:24px;text-align:center;">
            <p style="color:#B8D4A0;margin:0;font-size:13px;">© 2024 Avvai Iyarkai Agam. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const attachments = pdfBuffer
    ? [{ filename: `${poNumber}.pdf`, content: pdfBuffer, contentType: "application/pdf" }]
    : [];

  return await transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: `Purchase Order ${poNumber} from Avvai Iyarkai Agam`,
    html: emailHtml,
    attachments,
  });
}

