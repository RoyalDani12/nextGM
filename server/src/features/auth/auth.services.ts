import { RegisterDto } from "./auth.types.js";
import { AppError } from "../../middleware/appError.js";
import { findUserByEmail, createUserWithVerification } from "./auth.repository.js";
import { hashPassword } from "../../utils/auth.utils.js";
import { emailQueue } from "../../infrastructure/queue/queue.client.js";
import { verificationEmailTemplate } from "../../services/email.templates.js";

export const registerService = async (userData: RegisterDto) => {
  // check if the user is already exists
  const existingUser = await findUserByEmail(userData.email);
  if (existingUser) {
    throw new AppError(" Email already in use ", 409);
  }

  // hash password
  const hashedPassword: string = await hashPassword(userData.password);

  // create user + verification token
  const { user,rawToken }= await createUserWithVerification({
    ...userData,
    hashedPassword,
  });

     // get email templates
     const { subject ,html }  = verificationEmailTemplate(user.name,rawToken)

     // push  email  to job queue

     await emailQueue.add("verify-email",{
      to:user.email,
      subject,
      html
     })

  return { user };
};
