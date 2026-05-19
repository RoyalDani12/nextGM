import z from "zod";

export const updateProfileSchema = z.object({
    body: z
        .object({
            name: z
                .string()
                .trim()
                .min(3, "Name must be at least 3 characters")
                .max(50, "Name cannot exceed 50 characters")
                .optional(),

            phone: z
                .string()
                .trim()
                .regex(/^\+?[1-9]\d{1,14}$/, "Invalid international phone format")
                .optional(),

            address: z
                .string()
                .trim()
                .min(5, "Address must be at least 5 characters")
                .max(100, "Address cannot exceed 100 characters")
                .optional(),

            country: z
                .string()
                .trim()
                .min(2, "Country code/name must be at least 2 characters")
                .max(50, "Country name is too long")
                .optional(),

            city: z
                .string()
                .trim()
                .min(2, "City must be at least 2 characters")
                .max(50, "City cannot exceed 50 characters")
                .optional(),

            avatar: z
                .string()
                .url("Avatar must be a valid URL string")
                .max(2048, "URL is too long")
                .refine(
                    (url) => {
                        if (!url) return true;
                        return url.includes("res.cloudinary.com/nexions");
                    },
                    {
                        message:
                            "Avatar must be a valid Cloudinary URL from the authorized account.",
                    },
                )
                .optional(),
        })
        .strict(), // Rejects any unexpected fields (e.g., body.role = "admin")
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// change password schema

export const changePasswordSchema = z.object({
    body: z
        .object({
            oldPassword: z
                .string()
                .min(1, "Old password is required")
                .max(128, "Old password is too long"),

            newPassword: z
                .string()
                .min(8, "Password must be at least 8 characters long")
                .max(128, "Password is too long")
                .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
                .regex(/[a-z]/, "Password must contain at least one lowercase letter")
                .regex(/[0-9]/, "Password must contain at least one number")
                .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
                .refine((password) => !password.toLowerCase().includes("password"), {
                    message: "Password must not contain common weak patterns",
                }),

            confirmPassword: z.string().min(1, "Confirm password is required"),
        })

        .refine((data) => data.newPassword === data.confirmPassword, {
            message: "Passwords do not match",
            path: ["confirmPassword"],
        })

        .refine((data) => data.oldPassword !== data.newPassword, {
            message: "New password must be different from old password",
            path: ["newPassword"],
        }),
});

//deactivate account validation

export const deactivateSchema = z.object({
    body: z.object({
        password: z
            .string()
            .trim()
            .min(8, "Password must be at least 8 characters.")
            .max(128, "Password cannot exceed 128 characters."),
    }),
});

// reactivate schema
export const reactivationSchema =z.object({
    body:z.object({
        reactivationKey:z
        .string()
        .min(64,"Invalid reactivation key")
        .max(64,"Invalid reactivation key")
    })
})