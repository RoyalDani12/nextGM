import { Request, Response, NextFunction } from "express";
import { AppError } from "./appError.js";

export const authorizeRoles = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            throw new AppError("Forbidden.", 403);
        }
        next();
    };
};