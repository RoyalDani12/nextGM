import { cloudinary } from "../../infrastructure/storage/cloudinary.client.js";
import { AppError } from "../../middleware/appError.js";

import { findUserById, getUserProfile, updateUserProfileRepository } from "./user.repository.js";
// import { UpdateProfileDto } from "./user.types.js";
import { env } from "../../config/env.js";
import { extractPublicIdFromUrl } from "../../utils/cloudinaryHelper.js";
import { imageCleanupQueue } from "../../infrastructure/queue/queue.client.js";
export const getMeService = async (userId: string) => {
    const user = await getUserProfile(userId);

    if (!user) {
        throw new AppError("User not found.", 404);
    }

    // return  profile data
    return {
        user,
    };
};

// cloudinary service
export const generateAvatarUploadSignatureService = async () => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = "user_avatars";

    const signature = cloudinary.utils.api_sign_request(
        {
            timestamp,
            folder,
            // allowed_formats: "jpg,png,webp",
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
export const updateUserProfileService = async (userId: string, body: any) => {
    const userExists = await findUserById(userId);

    if (!userExists) {
        throw new AppError("User not found.", 404);
    }
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
