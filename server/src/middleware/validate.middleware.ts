import { Request, Response, NextFunction } from "express";
import { AppError } from "./appError.js";
import { ZodType } from "zod";

export const validate = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      return next(new AppError(JSON.stringify(errors), 400));
    }

    if (result.data) {
      const data = result.data as Record<string, unknown>;
      if (data.body !== undefined) req.body = data.body;
      if (data.query !== undefined) {
        try {
          req.query = data.query as Request["query"];
        } catch {
          Object.assign(req.query, data.query);
        }
      }
      if (data.params !== undefined) {
        try {
          req.params = data.params as Request["params"];
        } catch {
          Object.assign(req.params, data.params);
        }
      }
    }

    next();
  };
};
