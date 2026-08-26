
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