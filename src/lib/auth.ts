import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { betterAuth } from "better-auth";
import mongoose from "mongoose";

import dbConnect from "./db";

await dbConnect();

const db = mongoose.connection.db;

if (!db) {
  throw new Error("MongoDB is not connected");
}

const client = mongoose.connection.getClient();

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client,
  }),

  emailAndPassword: {
    enabled: true,
  },
});
