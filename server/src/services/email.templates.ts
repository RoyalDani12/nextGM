

export const verificationEmailTemplate =( name:string,token:string)=>{
  const verifyUrl =`http://localhost:5000/api/auth/verify-email?token=${token}`

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