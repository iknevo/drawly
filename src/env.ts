import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

export const env = createEnv({
  server: {
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url(),
    MONGODB_PASSWORD: z.string().min(1),
    MONGODB_URI: z.url(),
    MONGODB_NAME: z.string().min(1),
    GMAIL_USER: z.string().min(1),
    GMAIL_APP_PASSWORD: z.string().min(1),
  },

  clientPrefix: "NEXT_PUBLIC_",

  client: {
    NEXT_PUBLIC_APP_URL: z.string().min(1),
  },

  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
