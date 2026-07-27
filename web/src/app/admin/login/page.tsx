"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestOtp() {
    setError(null);
    const res = await fetch("/api/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
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
      body: JSON.stringify({ phone, code }),
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
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="mb-6 text-xl font-semibold text-slate-900">Admin Login</h1>
        <input
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
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
              className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
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
