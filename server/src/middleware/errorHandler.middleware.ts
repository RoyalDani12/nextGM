import { Response, Request, NextFunction } from "express";
import { AppError } from "./appError.js";

const isDev = process.env.NODE_ENV === "development";
export const errHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // known operational error / throw by us
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: "error",
      statusCode: err.statusCode,
      message: err.message,
  ...(isDev && { stack: err.stack }),
    });
    return;
  }

  // unKnown/ unExpected error

  console.error("Unexpected error", err);
  res.status(500).json({
    status: "error",
    statusCode: 500,
    message: "Something went wrong. please try again later.",
  });
};
