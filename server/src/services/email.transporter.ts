import { env } from "../config/env.js";
import nodemailer from "nodemailer"

export const transporter = nodemailer.createTransport({
  host:env.SMTP_HOST,
  port:env.SMTP_PORT,
  secure:false,
  auth:{
    user:env.SMTP_USER,
    pass:env.SMTP_PASS
  }
})

export const sendEmail = async (to: string, subject: string, html: string) => {
  await transporter.sendMail({
    from: `"Nexio" <${env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};


transporter.verify((error)=>{
  if(error){
     console.error("Email transporter error:", error.message);
  }else {
    console.log("Email transporter ready");
  }
})