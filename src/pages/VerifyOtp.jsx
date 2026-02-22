import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../lib/api";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const onVerify = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);

    try {
      if (!email) throw new Error("Missing email. Go back and request OTP again.");
      if (!otp.trim()) throw new Error("OTP is required");

      await api.post("/auth/verify-otp", {
        email: email.toLowerCase().trim(),
        otp: otp.trim(),
      });

      setMsg("OTP verified. Redirecting...");
      navigate("/reset-password", { state: { email, otp: otp.trim() } });
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setErr("");
    setMsg("");
    setLoading(true);

    try {
      if (!email) throw new Error("Missing email. Go back and request OTP again.");

      await api.post("/auth/forgot-password", { email: email.toLowerCase().trim() });
      setMsg("New OTP sent to your email.");
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow">
        <h1 className="text-white text-2xl font-bold">Verify OTP</h1>
        <p className="text-slate-300 mt-1 text-sm">
          Enter the OTP sent to <b>{email || "your email"}</b>
        </p>

        {err && <div className="mt-4 bg-red-900/30 border border-red-800 text-red-200 p-3 rounded">{err}</div>}
        {msg && <div className="mt-4 bg-emerald-900/30 border border-emerald-800 text-emerald-200 p-3 rounded">{msg}</div>}

        <form onSubmit={onVerify} className="mt-5 space-y-4">
          <div>
            <label className="text-slate-300 text-sm">OTP</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="mt-1 w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3"
              placeholder="6-digit OTP"
              inputMode="numeric"
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 font-semibold disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          <button
            type="button"
            onClick={onResend}
            disabled={loading}
            className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 text-white py-3 font-semibold disabled:opacity-60"
          >
            Resend OTP
          </button>
        </form>
      </div>
    </div>
  );
}
