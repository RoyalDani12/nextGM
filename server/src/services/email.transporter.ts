import { env } from "../config/env.js";
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

// In-memory compiler for generating 100% RFC 5322 compliant MIME messages with boundaries & headers
const mimeCompiler = nodemailer.createTransport({
  streamTransport: true,
  buffer: true,
  newline: "windows",
});

/**
 * Converts an HTML email body into clean, human-readable plain text.
 * Essential for avoiding SpamAssassin's MIME_HTML_ONLY penalty and satisfying
 * RFC multipart/alternative expectations of Gmail, Yahoo, and Outlook.
 */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => {
      const cleanText = text.replace(/<[^>]+>/g, "").trim();
      if (!href || href === "#" || href.startsWith("javascript:")) return cleanText;
      if (cleanText && cleanText !== href) return `${cleanText} (${href})`;
      return href;
    })
    .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, "\n\n$1\n")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n• $1")
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n\n$1")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<tr[^>]*>/gi, "\n")
    .replace(/<td[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

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

async function sendViaGmailApi(
  to: string,
  subject: string,
  html: string,
  text: string,
  from?: string,
) {
  const accessToken = await getGmailAccessToken();
  const clientUrl = env.CLIENT_URL || "https://nextgm.com";

  // Aligned sender address: e.g. "NextGM" <dani21.dev@gmail.com>
  const senderEmail = env.SMTP_USER && env.SMTP_USER.includes("@")
    ? env.SMTP_USER
    : "me";
  const defaultFrom = env.EMAIL_FROM || `"NextGM" <${senderEmail}>`;
  const sender = from || defaultFrom;

  // Compile a 100% RFC 5322 compliant multipart/alternative MIME message
  // Complete with Message-ID, Date, List-Unsubscribe, and clean plain-text fallback
  const compiled = await mimeCompiler.sendMail({
    from: sender,
    to,
    subject,
    text,
    html,
    headers: {
      "X-Mailer": "NextGM Mailer",
      "Auto-Submitted": "auto-generated",
      "X-Auto-Response-Suppress": "All",
      "List-Unsubscribe": `<${clientUrl}/account/settings>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      "Feedback-ID": "nextgm-transactional:notification:nextgm",
    },
  });

  const rawBuffer = compiled.message as Buffer;
  const encodedRaw = rawBuffer
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

  console.log(`[Gmail API HTTPS 443] RFC-compliant multipart email delivered to ${to} (Message-ID: ${compiled.messageId})`);
}

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  from?: string,
  customText?: string,
) => {
  const text = customText || htmlToPlainText(html);
  const clientUrl = env.CLIENT_URL || "https://nextgm.com";

  // Option 1: Gmail REST API over HTTPS (Port 443) - RFC 5322 compliant multipart MIME
  if (env.GMAIL_REFRESH_TOKEN) {
    await sendViaGmailApi(to, subject, html, text, from);
    return;
  }

  // Option 2: If RESEND_API_KEY is configured, use Resend via HTTPS (Port 443)
  if (env.RESEND_API_KEY) {
    const defaultFrom = env.EMAIL_FROM || "NextGM <onboarding@resend.dev>";
    const sender = from || defaultFrom;

    if (sender.includes("onboarding@resend.dev")) {
      console.warn(
        "⚠️ [Email Deliverability Notice] Sending via Resend sandbox 'onboarding@resend.dev'. " +
        "Emails may land in Spam until a custom verified domain is added to Resend DNS (SPF + DKIM)."
      );
    }

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
        text, // Plain text alternative avoids spam filters
        headers: {
          "List-Unsubscribe": `<${clientUrl}/account/settings>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          "Auto-Submitted": "auto-generated",
          "X-Auto-Response-Suppress": "All",
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Resend delivery failure:", err);
      throw new Error(`Resend email error: ${JSON.stringify(err)}`);
    }

    console.log(`[Resend HTTPS 443] Multipart email successfully dispatched to ${to}`);
    return;
  }

  // Option 3: Fallback to SMTP transport (Port 587 / local) with full headers & plain-text part
  const defaultFrom = env.EMAIL_FROM || `"NextGM" <${env.SMTP_USER}>`;
  const sender = from || defaultFrom;

  await transporter.sendMail({
    from: sender,
    to,
    subject,
    text,
    html,
    headers: {
      "List-Unsubscribe": `<${clientUrl}/account/settings>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      "Auto-Submitted": "auto-generated",
      "X-Auto-Response-Suppress": "All",
    },
  });
};

if (env.GMAIL_REFRESH_TOKEN) {
  console.log("Email service ready via Gmail REST API HTTPS (Port 443 - RFC-compliant multipart delivery)");
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