import slugify from "slugify";
import { randomBytes } from "crypto";

const MAX_RETRIES = 5;

export const generateUniqueSlug = async (
    name: string,
    checkExists: (slug: string) => Promise<boolean>,
): Promise<string> => {
    const baseSlug = slugify(name, { lower: true, strict: true, trim: true });

    let slug = baseSlug;
    let attempts = 0;
    while (await checkExists(slug)) {
        attempts++;
        if (attempts > MAX_RETRIES) {
            throw new Error("Could not generate a unique slug. please try a different name.");
        }
        const suffix = randomBytes(2).toString("hex");
        slug = `${baseSlug}-${suffix}`;
    }
    return slug;
};
