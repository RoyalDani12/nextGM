
import { env }  from '../config/env.js'
export const verificationEmailTemplate =( name:string,token:string)=>{
  const verifyUrl =`${env.CLIENT_URL}/verify-email?token=${token}`
  console.log(`Verify Email her : ${verifyUrl}`)

  return {
    subject:"Verify you email address",

        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to nxeio, ${name}!</h2>
        <p>Please verify your email address by clicking the button below.</p>
        <p>This link expires in <strong>24 hours</strong>.</p>
        <a href="${verifyUrl}" 
           style="
             display: inline-block;
             padding: 12px 24px;
             background-color: #4F46E5;
             color: white;
             text-decoration: none;
             border-radius: 6px;
             margin: 16px 0;
           ">
          Verify Email
        </a>
        <p>Or copy this link:</p>
        <p style="color: #6B7280; font-size: 14px;">${verifyUrl}</p>
        <p>If you did not create an account, ignore this email.</p>
      </div>
    `,
  }
}



export const welcomeEmailTemplate = (name: string) => {
  return {
    subject: "Welcome to Nxeio 🎉",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <h2>Welcome to Nxeio, ${name}!</h2>
        
        <p>Your email has been verified. Your account is now active.</p>
        
        <p>Here is what you can do now:</p>
        <ul>
          <li>Browse products from top shops</li>
          <li>Place your first order</li>
          <li>Create your own shop</li>
        </ul>

        <a href="${env.CLIENT_URL}/login"
           style="
             display: inline-block;
             padding: 12px 24px;
             background-color: #4F46E5;
             color: white;
             text-decoration: none;
             border-radius: 6px;
             margin: 16px 0;
           ">
          Get Started
        </a>

        <p style="color: #6B7280; font-size: 13px;">
          If you have any questions reply to this email.
        </p>

      </div>
    `,
  };
};

export const resetPasswordEmailTemplate = (name: string, token: string) => {
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;
  return {
    subject: "Reset your password",
    html: `
      <h2>Hi ${name},</h2>
      <p>You requested a password reset.</p>
      <p>This link expires in <strong>1 hour</strong>.</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>If you did not request this, ignore this email.</p>
    `,
  };
};


export const passwordResetSuccessTemplate = (name: string) => {
  return {
    subject: "Your password was changed",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi ${name},</h2>
        <p>Your password was successfully changed.</p>
        <p style="color: red;">
          <strong>If you did not make this change, contact support immediately.</strong>
        </p>
        <p>For security, you have been logged out of all devices.</p>
        <a href="${env.CLIENT_URL}/login"
           style="
             display: inline-block;
             padding: 12px 24px;
             background-color: #4F46E5;
             color: white;
             text-decoration: none;
             border-radius: 6px;
           ">
          Login Again
        </a>
      </div>
    `,
  };
};

export const accountDeletionScheduledTemplate = (name: string, reactivationToken: string) => {
  const cancelUrl = `${env.CLIENT_URL}/reactivate-account?token=${reactivationToken}`;
  
  return {
    subject: "Your Nexio account is scheduled for deletion",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E5E7EB; border-radius: 8px;">
        <h2 style="color: #DC2626;">Account Deletion Scheduled</h2>
        <p>Hi ${name},</p>
        <p>We received a request to permanently delete your Nexio account. Your account has been deactivated and scheduled for deletion.</p>
        
        <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 12px; margin: 16px 0;">
          <p style="margin: 0; color: #991B1B; font-weight: bold;">What happens next?</p>
          <p style="margin: 4px 0 0 0; color: #7F1D1D; font-size: 14px;">
            Your data will be permanently anonymized in <strong>30 days</strong>. After this period, your profile, active listings, and settings cannot be recovered.
          </p>
        </div>

        <p><strong>Did you make this request?</strong></p>
        <p>If yes, no further action is needed. If this was a mistake or your account was compromised, you can cancel this request within 30 days by clicking the button below:</p>
        
        <a href="${cancelUrl}" 
           style="
             display: inline-block;
             padding: 12px 24px;
             background-color: #4F46E5;
             color: white;
             text-decoration: none;
             border-radius: 6px;
             margin: 16px 0;
             font-weight: bold;
           ">
          Cancel Deletion Request
        </a>
        
        <p style="color: #6B7280; font-size: 13px;">
          If the button does not work, copy and paste this link into your browser:<br>
          <a href="${cancelUrl}" style="color: #4F46E5;">${cancelUrl}</a>
        </p>
      </div>
    `,
  };
};



type BaseTemplateParams = {
    previewText: string;
    heading: string;
    bodyHtml: string; // the per-notification content, injected here
    accentColor?: string;
};

const BRAND_COLOR = "#4F46E5";
const BRAND_COLOR_DARK = "#3730A3";
const TEXT_COLOR = "#1F2937";
const MUTED_COLOR = "#6B7280";
const BG_COLOR = "#F3F4F6";

const renderBaseTemplate = ({ previewText, heading, bodyHtml, accentColor }: BaseTemplateParams) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${heading}</title>
<style>
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.06); }
  }
  .animate-in { animation: fadeInUp 0.6s ease-out; }
  .icon-pulse { animation: pulse 1.8s ease-in-out infinite; }
  @media (max-width: 600px) {
    .container { width: 100% !important; }
    .px-40 { padding-left: 24px !important; padding-right: 24px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:${BG_COLOR}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <!-- preview text, hidden -->
  <div style="display:none; max-height:0; overflow:hidden;">${previewText}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG_COLOR};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

          <!-- header -->
          <tr>
            <td align="center" style="padding: 32px 40px 24px 40px; background: linear-gradient(135deg, ${BRAND_COLOR} 0%, ${BRAND_COLOR_DARK} 100%);">
              <span style="font-size:22px; font-weight:700; color:#ffffff; letter-spacing: -0.5px;">Nexions</span>
            </td>
          </tr>

          <!-- body -->
          <tr>
            <td class="px-40 animate-in" style="padding: 40px;">
              <h1 style="margin:0 0 16px 0; font-size:22px; font-weight:700; color:${TEXT_COLOR}; line-height:1.3;">
                ${heading}
              </h1>
              ${bodyHtml}
            </td>
          </tr>

          <!-- footer -->
          <tr>
            <td align="center" style="padding: 24px 40px 32px 40px; border-top: 1px solid #E5E7EB;">
              <p style="margin:0; font-size:13px; color:${MUTED_COLOR}; line-height:1.6;">
                You're receiving this because you have an account with Nexions.<br/>
                <a href="#" style="color:${MUTED_COLOR}; text-decoration:underline;">Manage notification preferences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
export const renderOrderPlacedEmail = (params: {
    customerName: string;
    orderId: string;
    shopName: string;
    totalAmount: string;
    itemCount: number;
}) => {
    const { customerName, orderId, shopName, totalAmount, itemCount } = params;

    const bodyHtml = `
      <div style="text-align:center; margin-bottom:24px;">
        <div class="icon-pulse" style="display:inline-flex; align-items:center; justify-content:center; width:64px; height:64px; border-radius:50%; background-color:#EEF2FF;">
          <span style="font-size:32px;">🛍️</span>
        </div>
      </div>
      <p style="margin:0 0 20px 0; font-size:15px; color:${TEXT_COLOR}; line-height:1.6;">
        Hi ${customerName}, thanks for your order at <strong>${shopName}</strong>! We're getting it ready.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9FAFB; border-radius:12px; margin:0 0 24px 0;">
        <tr>
          <td style="padding: 20px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding: 6px 0; font-size:14px; color:${MUTED_COLOR};">Order ID</td>
                <td align="right" style="padding: 6px 0; font-size:14px; color:${TEXT_COLOR}; font-weight:600;">#${orderId.slice(-8).toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size:14px; color:${MUTED_COLOR};">Items</td>
                <td align="right" style="padding: 6px 0; font-size:14px; color:${TEXT_COLOR}; font-weight:600;">${itemCount}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size:14px; color:${MUTED_COLOR}; border-top:1px solid #E5E7EB; padding-top:12px;">Total</td>
                <td align="right" style="padding: 6px 0; font-size:16px; color:${BRAND_COLOR}; font-weight:700; border-top:1px solid #E5E7EB; padding-top:12px;">$${totalAmount}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
        <tr>
          <td style="border-radius:8px; background-color:${BRAND_COLOR};">
            <a href="#" style="display:inline-block; padding:14px 32px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none;">
              Track your order
            </a>
          </td>
        </tr>
      </table>
    `;

    return renderBaseTemplate({
        previewText: `Your order at ${shopName} has been placed`,
        heading: "Order confirmed 🎉",
        bodyHtml,
    });
};

export const renderGenericNotificationEmail = (params: {
    userName: string;
    title: string;
    body: string;
    actionUrl?: string;
    actionText?: string;
}) => {
    const { userName, title, body, actionUrl, actionText } = params;

    const bodyHtml = `
      <p style="margin:0 0 16px 0; font-size:15px; color:${TEXT_COLOR}; line-height:1.6;">
        Hi ${userName},
      </p>
      <p style="margin:0 0 24px 0; font-size:15px; color:${TEXT_COLOR}; line-height:1.6;">
        ${body}
      </p>
      ${
        actionUrl && actionText
          ? `
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px auto;">
        <tr>
          <td style="border-radius:8px; background-color:${BRAND_COLOR};">
            <a href="${actionUrl}" style="display:inline-block; padding:14px 32px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none;">
              ${actionText}
            </a>
          </td>
        </tr>
      </table>
      `
          : ""
      }
    `;

    return renderBaseTemplate({
        previewText: title,
        heading: title,
        bodyHtml,
    });
};

export const renderShopApprovedEmail = (params: {
    ownerName: string;
    shopName: string;
    dashboardUrl: string;
}) => {
    const { ownerName, shopName, dashboardUrl } = params;
    const bodyHtml = `
      <p style="margin:0 0 16px 0; font-size:15px; color:${TEXT_COLOR}; line-height:1.6;">
        Hi ${ownerName},
      </p>
      <p style="margin:0 0 16px 0; font-size:15px; color:${TEXT_COLOR}; line-height:1.6;">
        Great news! Your shop <strong>${shopName}</strong> has been reviewed and approved by the NextGM administration team.
      </p>
      <p style="margin:0 0 24px 0; font-size:15px; color:${TEXT_COLOR}; line-height:1.6;">
        Your storefront is now fully active. You can log in, access your seller workspace, list your products, and start receiving customer orders.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px auto;">
        <tr>
          <td style="border-radius:8px; background-color:${BRAND_COLOR};">
            <a href="${dashboardUrl}" style="display:inline-block; padding:14px 32px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none;">
              Log In & View Your Shop
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:24px 0 0 0; font-size:13px; color:${MUTED_COLOR}; line-height:1.5; text-align:center;">
        If the button above does not work, visit your shop dashboard directly:<br/>
        <a href="${dashboardUrl}" style="color:${BRAND_COLOR}; word-break:break-all;">${dashboardUrl}</a>
      </p>
    `;

    return renderBaseTemplate({
        previewText: `Your shop "${shopName}" is approved!`,
        heading: "Your Shop is Approved! 🎉",
        bodyHtml,
    });
};

export const renderShopRejectedEmail = (params: {
    ownerName: string;
    shopName: string;
    reason: string;
    notes?: string;
    supportUrl: string;
}) => {
    const { ownerName, shopName, reason, notes, supportUrl } = params;
    const bodyHtml = `
      <p style="margin:0 0 16px 0; font-size:15px; color:${TEXT_COLOR}; line-height:1.6;">
        Hi ${ownerName},
      </p>
      <p style="margin:0 0 16px 0; font-size:15px; color:${TEXT_COLOR}; line-height:1.6;">
        Thank you for submitting your shop application for <strong>${shopName}</strong>.
      </p>
      <p style="margin:0 0 16px 0; font-size:15px; color:${TEXT_COLOR}; line-height:1.6;">
        After administrative review, we regret to inform you that your shop application could not be approved at this time.
      </p>
      <div style="margin:20px 0; padding:16px; border-left:4px solid #ef4444; background-color:#fef2f2; border-radius:6px;">
        <p style="margin:0 0 8px 0; font-size:14px; font-weight:bold; color:#991b1b;">Reason for decision:</p>
        <p style="margin:0; font-size:14px; color:#b91c1c;">${reason}</p>
        ${notes ? `<p style="margin:8px 0 0 0; font-size:13px; color:#7f1d1d;"><strong>Note:</strong> ${notes}</p>` : ""}
      </div>
      <p style="margin:0 0 24px 0; font-size:15px; color:${TEXT_COLOR}; line-height:1.6;">
        If you have questions or would like to submit updated information, please reach out to our support team.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px auto;">
        <tr>
          <td style="border-radius:8px; background-color:${BRAND_COLOR};">
            <a href="${supportUrl}" style="display:inline-block; padding:14px 32px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none;">
              Contact Support
            </a>
          </td>
        </tr>
      </table>
    `;

    return renderBaseTemplate({
        previewText: `Update regarding your shop application for "${shopName}"`,
        heading: "Shop Application Update",
        bodyHtml,
    });
};

export const renderMerchantWelcomeEmail = (params: {
    ownerName: string;
    shopName: string;
    dashboardUrl: string;
    isEmailVerified: boolean;
    verificationUrl?: string;
}) => {
    const { ownerName, shopName, dashboardUrl, isEmailVerified, verificationUrl } = params;

    const bodyHtml = `
      <!-- Welcome Hero Badge -->
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; padding: 6px 14px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #ea580c; background-color: #fff7ed; border: 1px solid #ffedd5; border-radius: 9999px;">
          🚀 MERCHANT STUDIO • WELCOME ABOARD
        </span>
      </div>

      <p style="margin: 0 0 16px 0; font-size: 16px; color: ${TEXT_COLOR}; line-height: 1.6;">
        Hi <strong>${ownerName}</strong>,
      </p>

      <p style="margin: 0 0 20px 0; font-size: 15px; color: ${TEXT_COLOR}; line-height: 1.6;">
        Congratulations on launching <strong>${shopName}</strong> on NextGM! You've taken the first step toward connecting with thousands of active buyers across our multi-tenant marketplace.
      </p>

      <!-- Review Status Banner (3D Card) -->
      <div style="margin: 24px 0; padding: 18px 20px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="36" valign="top">
              <span style="font-size: 24px;">⏳</span>
            </td>
            <td style="padding-left: 12px;">
              <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #0f172a;">
                Application Status: Under Review
              </p>
              <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                Our compliance team is currently reviewing your shop credentials. You will receive an instant email notification once your storefront is live. In the meantime, prepare your store to outrank the competition!
              </p>
            </td>
          </tr>
        </table>
      </div>

      ${
        !isEmailVerified && verificationUrl
          ? `
      <!-- Unverified Email Trust Alert (3D Glowing Card) -->
      <div style="margin: 24px 0; padding: 20px; background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 2px solid #f59e0b; border-radius: 14px; box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.15);">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="36" valign="top">
              <span style="font-size: 24px;">🛡️</span>
            </td>
            <td style="padding-left: 12px;">
              <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; color: #92400e;">
                Action Required: Verify Your Merchant Email to Build Buyer Trust
              </p>
              <p style="margin: 0 0 14px 0; font-size: 13px; color: #78350f; line-height: 1.5;">
                NextGM customers strongly prefer purchasing from verified merchants. Unverified stores cannot receive the official <strong>Verified Seller Badge</strong>. Confirm your email address today to establish immediate trust and prevent review delays.
              </p>
              <a href="${verificationUrl}" style="display: inline-block; padding: 10px 22px; font-size: 13px; font-weight: 700; color: #ffffff; background-color: #d97706; border-radius: 8px; text-decoration: none; box-shadow: 0 2px 4px rgba(217, 119, 6, 0.3);">
                Verify Email & Activate Trust Badge →
              </a>
            </td>
          </tr>
        </table>
      </div>
      `
          : ""
      }

      <!-- Competitive Recommendations Section -->
      <div style="margin: 32px 0 24px 0;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #0f172a; text-align: center;">
          🏆 4 Competitive Recommendations to Win on NextGM
        </h3>
        <p style="margin: 0 0 20px 0; font-size: 13px; color: #64748b; text-align: center;">
          Proven playbooks used by the top 5% of merchants to maximize buyer conversion from day one:
        </p>

        <!-- Card 1: Listing Quality -->
        <div style="margin-bottom: 12px; padding: 16px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="32" valign="top">
                <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; font-size: 12px; font-weight: bold; color: #ea580c; background-color: #fff7ed; border-radius: 50%;">1</span>
              </td>
              <td style="padding-left: 10px;">
                <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #0f172a;">
                  Curate High-Resolution Listings
                </p>
                <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                  Upload multi-angle imagery (1200x1200px+) and comprehensive feature bullets. Stores launching with <strong>5+ complete listings</strong> experience <strong>3.4x higher conversion</strong> in their first week.
                </p>
              </td>
            </tr>
          </table>
        </div>

        <!-- Card 2: Brand Identity -->
        <div style="margin-bottom: 12px; padding: 16px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="32" valign="top">
                <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; font-size: 12px; font-weight: bold; color: #2563eb; background-color: #eff6ff; border-radius: 50%;">2</span>
              </td>
              <td style="padding-left: 10px;">
                <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #0f172a;">
                  Complete Your Brand Profile & Policies
                </p>
                <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                  Add your store avatar, high-definition banner, and transparent returns/shipping policy. Transparent policies lower pre-purchase friction by <strong>85%</strong>.
                </p>
              </td>
            </tr>
          </table>
        </div>

        <!-- Card 3: Rapid Fulfillment -->
        <div style="margin-bottom: 12px; padding: 16px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="32" valign="top">
                <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; font-size: 12px; font-weight: bold; color: #059669; background-color: #ecfdf5; border-radius: 50%;">3</span>
              </td>
              <td style="padding-left: 10px;">
                <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #0f172a;">
                  Aim for Same-Day Fulfillment
                </p>
                <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                  Merchants who dispatch orders within 24 hours earn the prestigious <strong>"Fast Shipper"</strong> badge, unlocking algorithmic recommendation boosts on customer search pages.
                </p>
              </td>
            </tr>
          </table>
        </div>

        <!-- Card 4: Wallet & Payouts -->
        <div style="margin-bottom: 12px; padding: 16px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="32" valign="top">
                <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; font-size: 12px; font-weight: bold; color: #7c3aed; background-color: #f5f3ff; border-radius: 50%;">4</span>
              </td>
              <td style="padding-left: 10px;">
                <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #0f172a;">
                  Set Up Automated Payouts
                </p>
                <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                  Configure your settlement bank account in Merchant Settings so revenue from your delivered orders is disbursed automatically without delays.
                </p>
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Main CTA Button (3D Button) -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 32px auto 20px auto;">
        <tr>
          <td style="border-radius: 10px; background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); box-shadow: 0 4px 12px rgba(234, 88, 12, 0.35);">
            <a href="${dashboardUrl}" style="display: inline-block; padding: 16px 36px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; letter-spacing: 0.02em;">
              Enter Merchant Workspace →
            </a>
          </td>
        </tr>
      </table>

      <p style="margin: 20px 0 0 0; font-size: 12px; color: ${MUTED_COLOR}; line-height: 1.5; text-align: center;">
        Direct workspace link: <a href="${dashboardUrl}" style="color: #ea580c; word-break: break-all;">${dashboardUrl}</a>
      </p>
    `;

    return renderBaseTemplate({
        previewText: `Welcome to NextGM Merchants! Your store "${shopName}" is registered.`,
        heading: `Welcome to NextGM Merchants, ${ownerName}! 🎉`,
        bodyHtml,
    });
};

export const renderMerchantEmailVerificationPrompt = (params: {
    ownerName: string;
    shopName: string;
    verificationUrl: string;
    expiresInHours?: number;
}) => {
    const { ownerName, shopName, verificationUrl, expiresInHours = 24 } = params;

    const bodyHtml = `
      <!-- Trust Shield Badge -->
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="display: inline-block; padding: 6px 14px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #0284c7; background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 9999px;">
          🛡️ MERCHANT SECURITY & TRUST NETWORK
        </span>
      </div>

      <p style="margin: 0 0 16px 0; font-size: 16px; color: ${TEXT_COLOR}; line-height: 1.6;">
        Hi <strong>${ownerName}</strong>,
      </p>

      <p style="margin: 0 0 20px 0; font-size: 15px; color: ${TEXT_COLOR}; line-height: 1.6;">
        To activate and publish your store <strong>${shopName}</strong> on NextGM, please verify your email address. Email verification confirms your ownership and unlocks the official <strong>Verified Merchant</strong> status for your shop.
      </p>

      <!-- Why Verification Matters 3D Box -->
      <div style="margin: 24px 0; padding: 20px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #cbd5e1; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #334155;">
          Why NextGM Merchants Must Be Verified:
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 10px;">
          <tr>
            <td width="28" valign="top"><span style="font-size: 16px;">🌟</span></td>
            <td style="padding-left: 8px;">
              <p style="margin: 0; font-size: 13px; color: #0f172a; line-height: 1.4;">
                <strong>Build Immediate Buyer Trust:</strong> Shoppers look for the blue Verified Merchant badge before checkout, boosting average cart conversion by <strong>45%</strong>.
              </p>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 10px;">
          <tr>
            <td width="28" valign="top"><span style="font-size: 16px;">🚀</span></td>
            <td style="padding-left: 8px;">
              <p style="margin: 0; font-size: 13px; color: #0f172a; line-height: 1.4;">
                <strong>Fast-Track Review Approval:</strong> Super Admins require a verified email before approving storefront public listings.
              </p>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="28" valign="top"><span style="font-size: 16px;">🔒</span></td>
            <td style="padding-left: 8px;">
              <p style="margin: 0; font-size: 13px; color: #0f172a; line-height: 1.4;">
                <strong>Secure Financial Transactions:</strong> Ensures all settlement notifications, dispute responses, and payout alerts reach only you.
              </p>
            </td>
          </tr>
        </table>
      </div>

      <!-- Action Button (3D Glowing Emerald Button) -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 32px auto 20px auto;">
        <tr>
          <td style="border-radius: 10px; background: linear-gradient(135deg, #059669 0%, #047857 100%); box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4);">
            <a href="${verificationUrl}" style="display: inline-block; padding: 16px 36px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; letter-spacing: 0.02em;">
              Verify Merchant Email Now 🛡️
            </a>
          </td>
        </tr>
      </table>

      <p style="margin: 20px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
        This secure verification link expires in <strong>${expiresInHours} hours</strong>.<br/>
        If the button does not work, copy and paste this link into your browser:<br/>
        <a href="${verificationUrl}" style="color: #059669; word-break: break-all;">${verificationUrl}</a>
      </p>

      <p style="margin: 16px 0 0 0; font-size: 11px; color: #94a3b8; text-align: center;">
        If you did not register a shop on NextGM, you can safely ignore this email.
      </p>
    `;

    return renderBaseTemplate({
        previewText: `Verify your email for "${shopName}" to build trust with NextGM buyers.`,
        heading: "Verify Your Merchant Email 🛡️",
        bodyHtml,
    });
};
