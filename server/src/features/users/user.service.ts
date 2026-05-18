import { cloudinary } from "../../infrastructure/storage/cloudinary.client.js";
import { AppError } from "../../middleware/appError.js";

import {
    findUserById,
    getUserProfile,
    updateUserProfileRepository,
    updatePasswordAndDeleteRefreshToken,
    findUserWithPassword,
    deactivateAccountRepository,
} from "./user.repository.js";
import { changePasswordDto, UpdateProfileDto } from "./user.types.js";
import { env } from "../../config/env.js";
import { extractPublicIdFromUrl } from "../../utils/cloudinaryHelper.js";
import { imageCleanupQueue } from "../../infrastructure/queue/queue.client.js";
import { hashPassword, verifyPassword } from "../../services/token.service.js";
import { deleteUserSession } from "../../infrastructure/cache/session.cache.js";

export const getMeService = async (userId: string) => {
    const user = await getUserProfile(userId);

    if (!user) {
        throw new AppError("User not found.", 404);
    }

    // return  profile data
    return user;
};

// cloudinary service
export const generateAvatarUploadSignatureService = async (userId: string) => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = `user_avatars/${userId}`;

    const signature = cloudinary.utils.api_sign_request(
        {
            timestamp,
            folder,
            allowed_formats: "jpg,png,webp",
            max_file_size: 5000000,
        },
        env.CLOUDINARY_API_SECRET,
    );

    return {
        signature,
        timestamp,
        folder,
        apiKey: env.CLOUDINARY_API_KEY,
        cloudName: env.CLOUDINARY_CLOUD_NAME,
    };
};

// update profile service
export const updateUserProfileService = async (userId: string, body: UpdateProfileDto) => {
    const userExists = await findUserById(userId);

    if (!userExists) {
        throw new AppError("User not found.", 404);
    }
    // check the user sends data or empty
    const hasUpdates = Object.values(body).some((v) => v !== undefined);
    if (!hasUpdates) throw new AppError("No update data provided.", 400);
    const oldAvatarUrl = userExists?.profile?.avatar;

    const updateUser = await updateUserProfileRepository(userId, body);

    if (!updateUser) {
        throw new AppError("Failed to update profile", 500);
    }

    if (updateUser && body.avatar && oldAvatarUrl && oldAvatarUrl !== body.avatar) {
        const publicId = extractPublicIdFromUrl(oldAvatarUrl);
        if (publicId) {
            // add to the queue and return to user immediately
            await imageCleanupQueue.add("cleanup-avatar", { publicId });
        }
    }
    return updateUser;
};

// change password service

export const changePasswordService = async (userId: string, body: changePasswordDto) => {
    const { oldPassword, newPassword } = body;

    const user = await findUserWithPassword(userId);

    if (!user) {
        throw new AppError("User not found.", 404);
    }

    //verify old password
    const isMatch = await verifyPassword(oldPassword, user.password);

    if (!isMatch) {
        throw new AppError("Invalid current password.", 401);
    }

    // hash new password
    const hashedPassword = await hashPassword(newPassword);

    await updatePasswordAndDeleteRefreshToken(userId, hashedPassword);

    await deleteUserSession(userId);

    return {
        message: "Password updated. Please login again.",
    };
};

// deactivate service
export const deactivateAccountService = async (userId: string, password: string) => {
    const user = await findUserWithPassword(userId);
    if (!user) {
        throw new AppError("User is not found.", 404);
    }
    const isMatchPassword = await verifyPassword(password, user.password);

    if (!isMatchPassword) {
        throw new AppError("Incorrect password", 401);
    }

    await deactivateAccountRepository(userId);
    await deleteUserSession(userId);

    return {
        message: "Account deactivated successfully.To activate Contact support via email.",
    };
};
