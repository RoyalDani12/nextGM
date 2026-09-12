import type { Response } from "express";

export const GUEST_CART_COOKIE = "guest_cart_token";

export const setGuestCartCookie = (
    res: Response,
    token: string,
) => {
    res.cookie(GUEST_CART_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        path: "/",
    });
};

export const clearGuestCartCookie = (res: Response) => {
    res.clearCookie(GUEST_CART_COOKIE, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });
};