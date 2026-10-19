import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { username } from "better-auth/plugins";
import mongoose from "mongoose";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authHref } from "./auth-redirect";
import dbConnect from "./db";
import { sendPasswordResetEmail, sendVerificationEmail } from "./email";
import { env } from "@/env";

await dbConnect();

const db = mongoose.connection.db;

if (!db) {
  throw new Error("MongoDB is not connected");
}

const client = mongoose.connection.getClient();

const betterAuthInstance = betterAuth({
  database: mongodbAdapter(db, { client }),
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: ["http://localhost:3000", env.NEXT_PUBLIC_APP_URL, env.BETTER_AUTH_URL].filter(
    (v): v is string => Boolean(v) && v.length > 0
  ),
  accountLinking: {
    enabled: true,
    allowDifferentEmails: false,
    trustedProviders: ["google", "github"],
  },
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url);
    },
  },
  user: {
    additionalFields: {
      role: {
        type: ["user", "admin"],
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },
  plugins: [username()],
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email" && !ctx.body?.username) {
        throw new APIError("BAD_REQUEST", { message: "Username is required" });
      }
    }),
  },
});

type Role = "user" | "admin";

export const auth = {
  ...betterAuthInstance,

  async protect({
    role,
    guestOnly = false,
    redirectTo,
  }: { role?: Role; guestOnly?: boolean; redirectTo?: string } = {}) {
    const session = await betterAuthInstance.api.getSession({
      headers: await headers(),
    });

    if (guestOnly) {
      if (session) {
        redirect("/");
      }

      return null;
    }

    if (!session) {
      redirect(authHref("/auth/sign-in", redirectTo));
    }

    if (role && (session.user.role ?? "user") !== role) {
      redirect("/unauthorized");
    }

    return session;
  },
};
