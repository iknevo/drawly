import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { betterAuth } from "better-auth";
import mongoose from "mongoose";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
});

type Role = "user" | "admin";

export const auth = {
  ...betterAuthInstance,

  async protect({ role, guestOnly = false }: { role?: Role; guestOnly?: boolean } = {}) {
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
      redirect("/auth/sign-in");
    }

    if (role && session.user.role !== role) {
      redirect("/unauthorized");
    }

    return session;
  },
};
