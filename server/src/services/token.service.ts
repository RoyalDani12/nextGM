import bcrypt from "bcrypt";
import { changePasswordDto } from "../features/users/user.types.js";

// hash password
export const hashPassword = async (rawPassword: string) => {
    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    return hashedPassword;
};

// verify password
export const verifyPassword = async (plainTextPassword: string, hashedPassword: string) => {
    return await bcrypt.compare(plainTextPassword, hashedPassword);
};
