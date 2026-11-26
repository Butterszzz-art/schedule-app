"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function loginAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/today",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Invalid email or password.";
    }
    throw error;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signupAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const emailRaw = formData.get("email");
  const password = formData.get("password");

  if (typeof emailRaw !== "string" || typeof password !== "string") {
    return "Enter an email and password.";
  }

  const email = emailRaw.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return "Enter a valid email address.";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return "An account with that email already exists.";
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { email, password: passwordHash, settings: { create: {} } },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/onboarding" });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Account created -- sign in to continue.";
    }
    throw error;
  }
}
