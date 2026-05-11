// features/auth/auth.schema.ts
import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address").toLowerCase(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain uppercase letter")
      .regex(/[0-9]/, "Must contain a number")
      .regex(/[^a-zA-Z0-9]/, "Must contain a special character"),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>["body"];



// verify email schema
export const verifyEmailSchema = z.object({
  query:z.object({
    token:z.string().min(1,"Token required")
  })

})


// login schema
export const loginSchema = z.object({
     body:z.object({
      email:z.string().trim().email("Invalid Email or Password").toLowerCase(),

      password:z.string()
      .trim()
      .min(1,"The password is too short (Min 8 characters ).")
     })
})


// resend verification schema
export const resendVerificationSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Invalid email address"),
  })
});


// forgot password
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Invalid email address"),
  })
});

// reset password schema
export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Token is required"),
    newPassword: z.string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain uppercase letter")
      .regex(/[0-9]/, "Must contain a number")
      .regex(/[^a-zA-Z0-9]/, "Must contain a special character"),
  })
});

