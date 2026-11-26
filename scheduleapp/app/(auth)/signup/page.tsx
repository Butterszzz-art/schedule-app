"use client";

import { useActionState } from "react";
import { signupAction } from "@/lib/actions/auth";

export default function SignupPage() {
  const [error, formAction, isPending] = useActionState(signupAction, undefined);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <p className="mt-1 text-sm text-foreground/60">Create an account</p>
      </div>

      <form action={formAction} className="flex w-full max-w-xs flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs text-foreground/60">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-xl border border-card-border bg-[#141414] px-4 py-3 text-sm outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-xs text-foreground/60">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded-xl border border-card-border bg-[#141414] px-4 py-3 text-sm outline-none focus:border-accent"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-[#0A0A0A] transition-opacity disabled:opacity-60"
        >
          {isPending ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-sm text-foreground/50">
        Already have an account?{" "}
        <a href="/login" className="font-semibold text-accent">
          Sign in
        </a>
      </p>
    </main>
  );
}
