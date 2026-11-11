import { z } from "zod";

// Accept a studio domain with or without a scheme, including multi-part TLDs.
// Only ordinary HTTP(S) websites can be rendered as external links.
export const studioWebsiteSchema = z
  .string()
  .trim()
  .max(2048)
  .transform((value) =>
    /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`,
  )
  .pipe(
    z
      .url()
      .max(2048)
      .refine((value) => {
        try {
          const url = new URL(value);
          return (
            ["https:", "http:"].includes(url.protocol) &&
            !url.username &&
            !url.password &&
            url.hostname.includes(".") &&
            !/[\s]/.test(value)
          );
        } catch {
          return false;
        }
      }, "invalid_website"),
  );
