import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// Single hardcoded user for this personal, single-user app.
// Identity + password hash live in env vars, not in source.
const AUTH_USER_EMAIL = process.env.AUTH_USER_EMAIL;
const AUTH_USER_PASSWORD_HASH = process.env.AUTH_USER_PASSWORD_HASH;

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;

        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }
        if (!AUTH_USER_EMAIL || !AUTH_USER_PASSWORD_HASH) {
          throw new Error(
            "AUTH_USER_EMAIL / AUTH_USER_PASSWORD_HASH are not set in the environment"
          );
        }
        if (email.toLowerCase() !== AUTH_USER_EMAIL.toLowerCase()) {
          return null;
        }

        const valid = await bcrypt.compare(password, AUTH_USER_PASSWORD_HASH);
        if (!valid) return null;

        return { id: "1", email: AUTH_USER_EMAIL };
      },
    }),
  ],
});
