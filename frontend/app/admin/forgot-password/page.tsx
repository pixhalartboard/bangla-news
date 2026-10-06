"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAILS = [
  "pburmanr05@gmail.com",
  "bsardarreality26@gmail.com",
  "pixhalartboard@gmail.com",
];

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleResetRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage("Email address দিন।");
      return;
    }

    if (!ADMIN_EMAILS.includes(cleanEmail)) {
      setErrorMessage("এই Email address-এর জন্য Password Reset অনুমোদিত নয়।");
      return;
    }

    setIsLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(
      cleanEmail,
      {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      }
    );

    if (error) {
      setErrorMessage(
        "Password reset email পাঠানো যায়নি। আবার চেষ্টা করুন।"
      );
      setIsLoading(false);
      return;
    }

    setMessage(
      "Password reset করার জন্য আপনার Email inbox দেখুন।"
    );

    setIsLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-black">
            Forgot Password
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            আপনার Admin Email address দিন
          </p>
        </div>

        <form onSubmit={handleResetRequest} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-base font-semibold text-black"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              autoComplete="email"
              className="w-full rounded-lg border border-slate-400 bg-white px-4 py-3 text-base text-black placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {errorMessage && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errorMessage}
            </div>
          )}

          {message && (
            <div className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "পাঠানো হচ্ছে..." : "Reset Password"}
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