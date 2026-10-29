import { transporter } from "../../services/email.transporter.js";
import { env } from "../../config/env.js";

const BRAND_NAME = "Nexions Customer Care";
const SUPPORT_EMAIL = "support@nexions.io";

/**
 * Dispatches an email safely without throwing or breaking API requests if SMTP is slow/offline.
 */
async function dispatchEmail(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({
      from: `"${BRAND_NAME}" <${SUPPORT_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`[Support Email Sent] to: ${to} | subject: ${subject}`);
  } catch (err: any) {
    console.error(`[Support Email Warning] Could not deliver email to ${to}:`, err?.message || err);
  }
}

/**
 * Sent to the customer (or guest) right after they submit a ticket.
 */
export async function sendTicketCreatedEmail(params: {
  to: string;
  name: string;
  ticketNumber: string;
  subject: string;
  category: string;
  message: string;
}) {
  const { to, name, ticketNumber, subject, category, message } = params;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Ticket Received #${ticketNumber}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 16px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              
              <!-- Header -->
              <tr>
                <td style="padding: 28px 36px; background-color: #0f172a; color: #ffffff;">
                  <table width="100%">
                    <tr>
                      <td>
                        <span style="display: inline-block; background-color: #ea580c; color: #ffffff; font-weight: 900; font-size: 14px; padding: 4px 10px; border-radius: 8px;">NEXIONS</span>
                        <h1 style="margin: 12px 0 0 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: #ffffff;">We Received Your Support Request</h1>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 36px;">
                  <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                    Hello <strong>${name}</strong>,
                  </p>
                  <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                    Thank you for reaching out to Nexions Customer Support. Your ticket has been recorded in our system. A support specialist is reviewing your inquiry and will email you back directly.
                  </p>

                  <!-- Ticket Summary Box -->
                  <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
                    <table width="100%" style="font-size: 13px;">
                      <tr>
                        <td style="padding-bottom: 8px; color: #9a3412; font-weight: 700; text-transform: uppercase; font-size: 11px;">Ticket Reference</td>
                        <td style="padding-bottom: 8px; color: #ea580c; font-weight: 800; font-family: monospace; font-size: 14px; text-align: right;">#${ticketNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 8px; color: #78350f; font-weight: 600;">Category</td>
                        <td style="padding-bottom: 8px; color: #1e293b; text-align: right; font-weight: 600;">${category.replace(/_/g, " ")}</td>
                      </tr>
                      <tr>
                        <td style="color: #78350f; font-weight: 600;">Subject</td>
                        <td style="color: #1e293b; text-align: right; font-weight: 700;">${subject}</td>
                      </tr>
                    </table>
                  </div>

                  <!-- Copy of Message -->
                  <div style="background-color: #f8fafc; border-left: 4px solid #cbd5e1; padding: 14px 18px; border-radius: 0 10px 10px 0; margin-bottom: 24px;">
                    <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b;">Your Message</p>
                    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #334155; white-space: pre-wrap;">${message}</p>
                  </div>

                  <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.6; color: #64748b;">
                    <strong>Note:</strong> You do not need to check a website constantly. When a member of our team responds, you will receive an email directly to this address (<strong>${to}</strong>).
                  </p>

                  <div style="text-align: center; margin-top: 24px;">
                    <a href="${env.CLIENT_URL}/contact" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 28px; border-radius: 12px;">Visit Help & Support</a>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 24px 36px; background-color: #f1f5f9; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                  <p style="margin: 0 0 6px 0;">Nexions Global Marketplace & SaaS Platform</p>
                  <p style="margin: 0;">This email was sent to ${to} regarding ticket #${ticketNumber}.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await dispatchEmail(to, `[Support Ticket #${ticketNumber}] We received your inquiry: ${subject}`, html);
}

/**
 * Sent to the customer whenever an Admin/Support Team member replies.
 */
export async function sendTicketStaffReplyEmail(params: {
  to: string;
  name: string;
  ticketNumber: string;
  subject: string;
  staffReply: string;
  staffName?: string;
}) {
  const { to, name, ticketNumber, subject, staffReply, staffName } = params;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reply to Ticket #${ticketNumber}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 16px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              
              <!-- Header -->
              <tr>
                <td style="padding: 28px 36px; background-color: #0f172a; color: #ffffff;">
                  <table width="100%">
                    <tr>
                      <td>
                        <span style="display: inline-block; background-color: #ea580c; color: #ffffff; font-weight: 900; font-size: 14px; padding: 4px 10px; border-radius: 8px;">NEXIONS SUPPORT</span>
                        <h1 style="margin: 12px 0 0 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: #ffffff;">New Message From Support Specialist</h1>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 36px;">
                  <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                    Hello <strong>${name}</strong>,
                  </p>
                  <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                    Our support team has reviewed your ticket regarding <strong>"${subject}"</strong> and provided the response below:
                  </p>

                  <!-- Staff Response Box -->
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 5px solid #ea580c; border-radius: 12px; padding: 22px; margin-bottom: 24px;">
                    <div style="display: flex; align-items: center; margin-bottom: 12px;">
                      <p style="margin: 0; font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">
                        🛡️ ${staffName || "Nexions Support Specialist"}
                      </p>
                    </div>
                    <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #1e293b; white-space: pre-wrap;">${staffReply}</p>
                  </div>

                  <!-- Ticket Details Pill -->
                  <p style="margin: 0 0 24px 0; font-size: 12px; color: #64748b; background-color: #f1f5f9; padding: 10px 16px; border-radius: 10px;">
                    <strong>Ticket ID:</strong> #${ticketNumber} &nbsp;|&nbsp; <strong>Status:</strong> Awaiting Your Feedback
                  </p>

                  <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.6; color: #475569;">
                    If this solves your issue, you can simply keep this email for your records. If you need further assistance, you can view your ticket or submit a reply anytime.
                  </p>

                  <div style="text-align: center; margin-top: 24px;">
                    <a href="${env.CLIENT_URL}/contact" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 28px; border-radius: 12px; box-shadow: 0 2px 4px rgba(234, 88, 12, 0.2);">View Support Ticket</a>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 24px 36px; background-color: #f1f5f9; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                  <p style="margin: 0 0 6px 0;">Nexions Customer Service Operations</p>
                  <p style="margin: 0;">This email was sent to ${to} for ticket #${ticketNumber}.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await dispatchEmail(to, `[Update on Ticket #${ticketNumber}] Support Team replied: ${subject}`, html);
}

/**
 * Sent when a ticket is officially marked as Resolved.
 */
export async function sendTicketResolvedEmail(params: {
  to: string;
  name: string;
  ticketNumber: string;
  subject: string;
}) {
  const { to, name, ticketNumber, subject } = params;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Ticket #${ticketNumber} Resolved</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 16px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0;">
              
              <!-- Header -->
              <tr>
                <td style="padding: 28px 36px; background-color: #0f172a; color: #ffffff;">
                  <span style="display: inline-block; background-color: #10b981; color: #ffffff; font-weight: 900; font-size: 13px; padding: 4px 10px; border-radius: 8px;">RESOLVED</span>
                  <h1 style="margin: 12px 0 0 0; font-size: 20px; font-weight: 800; color: #ffffff;">Your Support Ticket Has Been Resolved</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 36px;">
                  <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                    Hello <strong>${name}</strong>,
                  </p>
                  <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                    Your support inquiry regarding <strong>"${subject}"</strong> (Ticket <strong>#${ticketNumber}</strong>) has been marked as <strong>Resolved</strong>.
                  </p>
                  <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.6; color: #64748b;">
                    If you still experience issues or have any questions, you can always open a new request anytime on Nexions.
                  </p>
                  <p style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a;">
                    Thank you for being part of Nexions!
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px 36px; background-color: #f1f5f9; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                  <p style="margin: 0;">Nexions Support &bull; #${ticketNumber}</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await dispatchEmail(to, `[Resolved: Ticket #${ticketNumber}] Your request has been resolved: ${subject}`, html);
}
