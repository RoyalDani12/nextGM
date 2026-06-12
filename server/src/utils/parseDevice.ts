

import { UAParser } from "ua-parser-js";

export const parseDeviceName = (userAgent: string): string => {
    if (!userAgent) return "Unknown device";

    const parser = new UAParser(userAgent);

    const browser = parser.getBrowser().name ?? "Unknown browser";
    const os = parser.getOS().name ?? "Unknown OS";
    const device = parser.getDevice().type ?? "desktop";

    return `${browser} on ${os} (${device})`;
};
