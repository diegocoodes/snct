import nodemailer from "nodemailer";

type SecurityEmail = {
  to: string;
  subject: string;
  heading: string;
  message: string;
  actionLabel: string;
  actionUrl: string;
};

function getTransport() {
  const host = process.env.SNCT_SMTP_HOST;
  const port = Number(process.env.SNCT_SMTP_PORT ?? 587);
  const user = process.env.SNCT_SMTP_USER;
  const pass = process.env.SNCT_SMTP_PASSWORD;

  if (!host || !user || !pass) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("O serviço SMTP não foi configurado.");
    }
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    requireTLS: port !== 465,
  });
}

export async function sendSecurityEmail(email: SecurityEmail) {
  const transport = getTransport();
  if (!transport) return;

  const from = process.env.SNCT_EMAIL_FROM;
  if (!from) throw new Error("SNCT_EMAIL_FROM não foi configurado.");

  await transport.sendMail({
    from,
    to: email.to,
    subject: email.subject,
    text: `${email.heading}\n\n${email.message}\n\n${email.actionLabel}: ${email.actionUrl}`,
    html: `
      <div style="background:#10002b;padding:32px;font-family:Arial,sans-serif;color:#f7f7fb">
        <div style="max-width:560px;margin:auto;border:1px solid #6d28d9;border-radius:18px;padding:28px;background:#17112f">
          <h1 style="font-size:24px;margin:0 0 16px">${email.heading}</h1>
          <p style="line-height:1.7;color:#d7d2e8">${email.message}</p>
          <a href="${email.actionUrl}" style="display:inline-block;margin-top:16px;padding:13px 20px;border-radius:10px;background:#6d00ff;color:white;text-decoration:none;font-weight:700">${email.actionLabel}</a>
          <p style="margin-top:24px;font-size:12px;color:#a9a2bd">Se você não solicitou esta ação, ignore esta mensagem.</p>
        </div>
      </div>`,
  });
}
