import { pinoHttp } from "pino-http";
import { logger } from "../config/logger.js";
import { randomUUID } from "crypto";
import { IncomingMessage, ServerResponse } from "http";

export const httpLogger = pinoHttp({
    logger,

    genReqId: (req: IncomingMessage): string => {
        const existingId = req.headers["x-request-id"];
        if (Array.isArray(existingId)) return existingId[0] || randomUUID();
        return (existingId as string) || randomUUID();
    },

    customLogLevel: (_req: IncomingMessage, res: ServerResponse, err?: Error) => {
        if (res.statusCode >= 500 || err) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
    },

    serializers: {
        req: (req: any) => ({
            id: req.id || req.raw?.id, 
            method: req.method,
            url: req.url,
        }),
        res: (res: any) => ({
            statusCode: res.statusCode,
        }),
    }
});