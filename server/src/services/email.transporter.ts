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


transporter.verify((error)=>{
  if(error){
     console.error("Email transporter error:", error.message);
  }else {
    console.log("Email transporter ready");
  }
})