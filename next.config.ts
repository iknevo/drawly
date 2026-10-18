import type { NextConfig } from "next";

// @ts-expect-error - next-pwa has no type declarations
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  transpilePackages: ["@quickdrawjs/core", "@quickdrawjs/react"],
  turbopack: {},
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
