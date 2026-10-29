import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  avatar: z.string().url().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, { message: "Current password is required." }),
  newPassword: z.string()
    .min(8, { message: "Password must be at least 8 characters." })
    .regex(/[A-Z]/, "Include at least one uppercase letter.")
    .regex(/[a-z]/, "Include at least one lowercase letter.")
    .regex(/[0-9]/, "Include at least one number.")
    .regex(/[^A-Za-z0-9]/, "Include at least one special character."),
  confirmPassword: z.string().min(1, { message: "Please confirm your new password." }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine((data) => data.oldPassword !== data.newPassword, {
  message: "New password must be different from your current password.",
  path: ["newPassword"],
});

export const deactivateSchema = z.object({
  password: z.string().min(1, { message: "Password is required to deactivate account." }).optional(),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, { message: "Password is required to delete account." }),
});

export const reactivationSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;