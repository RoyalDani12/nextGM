
import { env }  from '../config/env.js'
export const verificationEmailTemplate =( name:string,token:string)=>{
  const verifyUrl =`${env.CLIENT_URL}/verify-email?token=${token}`

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