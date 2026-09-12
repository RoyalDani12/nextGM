import crypto from "node:crypto";

export const generateGuestCartToken = (): string => {
    return crypto.randomBytes(32).toString("hex");
};