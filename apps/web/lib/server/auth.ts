import { prisma } from "@jzmle/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";

export const auth = betterAuth({
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Moodial",
  baseURL: process.env.APP_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET ?? "dev-secret-change-me-before-production-32",
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    disableSignUp: true,
    minPasswordLength: 8
  },
  plugins: [
    username({
      minUsernameLength: 3,
      usernameValidator: (value) => /^[a-zA-Z0-9_.-]+$/.test(value)
    }),
    nextCookies()
  ],
  user: {
    modelName: "user"
  },
  session: {
    modelName: "session"
  },
  account: {
    modelName: "account"
  },
  verification: {
    modelName: "verification"
  }
});
