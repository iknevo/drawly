import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { username } from "better-auth/plugins";
import mongoose from "mongoose";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authHref } from "./auth-redirect";
import dbConnect from "./db";

await dbConnect();

const db = mongoose.connection.db;

if (!db) {
  throw new Error("MongoDB is not connected");
}

const client = mongoose.connection.getClient();

const betterAuthInstance = betterAuth({
  database: mongodbAdapter(db, { client }),
  emailAndPassword: {
    enabled: true,
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

    if (role && session.user.role !== role) {
      redirect("/unauthorized");
    }

    return session;
  },
};
