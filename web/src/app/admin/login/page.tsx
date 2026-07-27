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
    <div style={{ maxWidth: 360, margin: "80px auto" }}>
      <h1>Admin Login</h1>
      <input
        placeholder="Phone number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
      />
      {!otpSent ? (
        <button onClick={requestOtp} style={{ padding: 8, width: "100%" }}>
          Send code
        </button>
      ) : (
        <>
          <input
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
          />
          <button onClick={verifyAndLogin} style={{ padding: 8, width: "100%" }}>
            Verify & sign in
          </button>
        </>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
