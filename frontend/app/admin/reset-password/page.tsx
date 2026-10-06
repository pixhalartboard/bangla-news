"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleResetPassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");

    if (!password || !confirmPassword) {
      setErrorMessage("নতুন Password এবং Confirm Password দিন।");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password কমপক্ষে ৬ অক্ষরের হতে হবে।");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("দুটি Password একই নয়।");
      return;
    }

    setIsLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setErrorMessage(
        "Password পরিবর্তন করা যায়নি। Reset link আবার request করুন।"
      );
      setIsLoading(false);
      return;
    }

    await supabase.auth.signOut();

    router.push("/admin/login?reset=success");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-black">
            Reset Password
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            নতুন Password সেট করুন
          </p>
        </div>

        <form
          onSubmit={handleResetPassword}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-base font-semibold text-black"
            >
              New Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="নতুন Password"
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-400 bg-white px-4 py-3 text-base text-black placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-base font-semibold text-black"
            >
              Confirm Password
            </label>

            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Password আবার লিখুন"
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-400 bg-white px-4 py-3 text-base text-black placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {errorMessage && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading
              ? "Password পরিবর্তন হচ্ছে..."
              : "Update Password"}
          </button>

          <div className="text-center">
            <a
              href="/admin/login"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              ← Login page-এ ফিরে যান
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}