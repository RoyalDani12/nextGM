import { env } from "../config/env.js";
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string, from?: string) => {
  // If RESEND_API_KEY is configured, use Resend via HTTPS (Port 443)
  // This bypasses cloud firewalls (like Render Free tier) that block SMTP ports 587/465/25
  if (env.RESEND_API_KEY) {
    const sender = from || env.EMAIL_FROM || "Nexio <onboarding@resend.dev>";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sender,
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Resend delivery failure:", err);
      throw new Error(`Resend email error: ${JSON.stringify(err)}`);
    }

    console.log(`[Resend HTTPS 443] Email successfully dispatched to ${to}`);
    return;
  }

  // Fallback to SMTP transport (Port 587 / local)
  await transporter.sendMail({
    from: from || `"Nexio" <${env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};

if (!env.RESEND_API_KEY && env.SMTP_USER) {
  transporter.verify((error) => {
    if (error) {
      console.error("Email transporter error:", error.message);
    } else {
      console.log("Email transporter ready (SMTP 587)");
    }
  });
} else if (env.RESEND_API_KEY) {
  console.log("Email service ready via Resend HTTPS (Port 443)");
}