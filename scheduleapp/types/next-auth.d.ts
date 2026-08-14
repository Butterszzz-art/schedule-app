import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

// next-auth/jwt re-exports JWT from @auth/core/jwt, so the augmentation
// has to target the module where the interface is actually declared.
declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
  }
}
