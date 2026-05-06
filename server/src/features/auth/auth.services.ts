import { RegisterDto } from "./auth.types.js";
import { AppError } from "../../middleware/appError.js";
import {
    findUserByEmail,
    createUserWithVerification,
    findEmailVerification,
    markEmailVerified,
} from "./auth.repository.js";
import { hashPassword } from "../../utils/auth.utils.js";
import { emailQueue } from "../../infrastructure/queue/queue.client.js";
import { verificationEmailTemplate } from "../../services/email.templates.js";
import crypto from "crypto";





export const registerService = async (userData: RegisterDto) => {

    
    const existingUser = await findUserByEmail(userData.email);
    if (existingUser) {
        throw new AppError(" Email already in use ", 409);
    }

    // hash password
    const hashedPassword: string = await hashPassword(userData.password);

    // create user + verification token
    const { user, rawToken } = await createUserWithVerification({
        ...userData,
        hashedPassword,
    });

    // get email templates
    const { subject, html } = verificationEmailTemplate(user.name, rawToken);


    // push  email  to job queue
    await emailQueue.add("verify-email", {
        to: user.email,
        subject,
        html,
    });

    return { user };
};




// verify  email service
export const verifyEmailService = async (token: string) => {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // find the verification record
    const verification = await findEmailVerification(hashedToken);

    if (!verification) {
        throw new AppError("Invalid or Expired verification link", 400);
    }

    // check expiry
    if (verification.expiresAt < new Date()) {
        throw new AppError("Verification link has expired. Please request a new one.", 400);
    }

    // check if already verified
    if (verification.user.isEmailVerified) {
        throw new AppError("Email is already verified.", 400);
    }

    // mark verified and burn the token
    await markEmailVerified(verification.userId, verification.id);

    return {
        message: "Email verified successfully. You can now log in.",
    };
};
