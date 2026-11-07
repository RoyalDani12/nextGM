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

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

async function getGmailAccessToken(): Promise<string> {
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedAccessToken;
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GMAIL_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("Failed to refresh Gmail access token:", err);
    throw new Error(`Gmail OAuth token error: ${JSON.stringify(err)}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedAccessToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  return cachedAccessToken;
}

async function sendViaGmailApi(to: string, subject: string, html: string, from?: string) {
  const accessToken = await getGmailAccessToken();
  const sender = from || `"Nexio" <${env.SMTP_USER || "me"}>`;

  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
  const messageParts = [
    `From: ${sender}`,
    `To: ${to}`,
    "Content-Type: text/html; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: ${utf8Subject}`,
    "",
    html,
  ];
  const rawMessage = messageParts.join("\r\n");
  const encodedRaw = Buffer.from(rawMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encodedRaw }),
  });

  if (!sendRes.ok) {
    const err = await sendRes.json().catch(() => ({}));
    console.error("Gmail API delivery failure:", err);
    throw new Error(`Gmail API error: ${JSON.stringify(err)}`);
  }

  console.log(`[Gmail API HTTPS 443] Email successfully delivered to ${to}`);
}

export const sendEmail = async (to: string, subject: string, html: string, from?: string) => {
  // Option 1: Gmail REST API over HTTPS (Port 443) - 100% Free, sends to anyone without a custom domain!
  if (env.GMAIL_REFRESH_TOKEN) {
    await sendViaGmailApi(to, subject, html, from);
    return;
  }

  // Option 2: If RESEND_API_KEY is configured, use Resend via HTTPS (Port 443)
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

if (env.GMAIL_REFRESH_TOKEN) {
  console.log("Email service ready via Gmail REST API HTTPS (Port 443 - free sending to all users)");
} else if (env.RESEND_API_KEY) {
  console.log("Email service ready via Resend HTTPS (Port 443)");
} else if (env.SMTP_USER) {
  transporter.verify((error) => {
    if (error) {
      console.error("Email transporter error:", error.message);
    } else {
      console.log("Email transporter ready (SMTP 587)");
    }
  });
}