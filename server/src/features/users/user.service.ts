import { AppError } from "../../middleware/appError.js";

import { getUserProfile } from "./user.repository.js";
export const getMeService = async (userId: string) => {
    const user = await getUserProfile(userId);

    if (!user) {
        throw new AppError("User not found.", 404);
    }

    // return  profile data
    return {
        user,
        message: "profile data fetch successFully.",
    };
};
