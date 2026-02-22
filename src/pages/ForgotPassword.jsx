import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });
      setMsg("OTP sent. Check your email (Inbox/Spam).");

      // go to verify page with email
      navigate("/verify-otp", { state: { email } });
    } catch (error) {
      setErr(error?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h1 className="text-white text-2xl font-semibold mb-2">Forgot Password</h1>
        <p className="text-slate-400 text-sm mb-6">
          Enter your email to receive a 6-digit OTP.
        </p>

        {msg && <div className="mb-4 text-green-300 text-sm">{msg}</div>}
        {err && <div className="mb-4 text-red-300 text-sm">{err}</div>}

        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="text-slate-300 text-sm">Email</label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 text-white border border-slate-700 outline-none focus:border-slate-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              required
            />
          </div>

          <button
            disabled={loading}
            className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium"
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}
