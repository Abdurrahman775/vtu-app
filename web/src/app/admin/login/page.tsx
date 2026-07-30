"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestOtp() {
    setError(null);
    const res = await fetch("/api/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      setError("Failed to send code");
      return;
    }
    setOtpSent(true);
  }

  async function verifyAndLogin() {
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Login failed");
      return;
    }
    router.push("/admin/transactions");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 to-blue-700 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-900">
        <h1 className="mb-6 text-xl font-semibold text-slate-900 dark:text-slate-100">Admin Login</h1>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        {!otpSent ? (
          <button
            onClick={requestOtp}
            className="w-full rounded-lg bg-blue-700 py-2 text-sm font-medium text-white hover:bg-blue-800 transition-colors"
          >
            Send code
          </button>
        ) : (
          <>
            <input
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <button
              onClick={verifyAndLogin}
              className="w-full rounded-lg bg-blue-700 py-2 text-sm font-medium text-white hover:bg-blue-800 transition-colors"
            >
              Verify & sign in
            </button>
          </>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
