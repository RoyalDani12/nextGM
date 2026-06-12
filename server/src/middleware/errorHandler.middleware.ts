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

    req.log.warn({ err, statusCode: err.statusCode }, "Operational error")
    res.status(err.statusCode).json({
      status: "error",
      statusCode: err.statusCode,
      message: err.message,
       requestId:  req.id,    
  ...(isDev && { stack: err.stack }),
    });
    return;
  }

  // unKnown/ unExpected error

  req.log.error({ err }, "Unexpected error")
  res.status(500).json({
    status: "error",
    statusCode: 500,
    message: "Something went wrong. please try again later.",
    requestId:  req.id,
  });
};
