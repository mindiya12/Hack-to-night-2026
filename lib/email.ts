import nodemailer from 'nodemailer'

function createTransporter() {
  const host = process.env.SMTP_HOST
  if (!host) return null
  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })
}

export async function sendOTPEmail(
  to: string,
  otp: string,
  name: string,
  purpose: 'transfer' | 'payment' = 'transfer'
) {
  const label = purpose === 'transfer' ? 'Transfer' : 'Payment'

  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f0f7;padding:40px 16px;min-height:100vh;">
    <div style="max-width:520px;margin:0 auto;background:white;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(69,0,67,0.1);">
      <div style="background:linear-gradient(135deg,#1d0730 0%,#450043 60%,#6b2568 100%);padding:32px;text-align:center;">
        <h1 style="color:white;margin:0;font-size:26px;font-weight:900;letter-spacing:-0.5px;">Nova Bank</h1>
        <p style="color:rgba(255,255,255,0.65);margin:4px 0 0;font-size:13px;">Secure Banking Platform</p>
      </div>
      <div style="padding:36px 32px;">
        <p style="color:#1d0730;font-size:16px;margin:0 0 8px;">Hello <strong>${name}</strong>,</p>
        <p style="color:#555;font-size:15px;margin:0 0 28px;line-height:1.6;">
          We received a request to authorise a <strong>${label}</strong> on your Nova Bank account.
          Use the one-time password below to proceed.
        </p>
        <div style="background:#f9f0f9;border:1.5px solid #e8d0e8;border-radius:16px;padding:28px;text-align:center;margin-bottom:24px;">
          <p style="color:#9a5c97;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Your OTP</p>
          <p style="color:#450043;font-size:48px;font-weight:900;letter-spacing:14px;margin:0;font-variant-numeric:tabular-nums;">${otp}</p>
        </div>
        <div style="background:#fff8e6;border-left:3px solid #f59e0b;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
          <p style="color:#92400e;font-size:13px;margin:0;font-weight:600;">⏱ Expires in 10 minutes · Do not share this code with anyone.</p>
        </div>
        <p style="color:#bbb;font-size:12px;text-align:center;margin:0;">
          If you did not request this, please contact Nova Bank immediately.
        </p>
      </div>
    </div>
  </div>`

  const transporter = createTransporter()
  if (!transporter) {
    console.log(
      `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `  [Nova Bank] OTP (SMTP not configured)\n` +
        `  To      : ${to}\n` +
        `  Purpose : ${label}\n` +
        `  Code    : ${otp}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    )
    return
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"Nova Bank" <noreply@novabank.lk>',
    to,
    subject: `Nova Bank – Your ${label} OTP: ${otp}`,
    html
  })
}
