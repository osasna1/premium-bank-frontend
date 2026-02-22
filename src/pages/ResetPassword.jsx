import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email || "";
  const otp = state?.otp || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If user refreshes page and state is gone, send them back
    if (!email || !otp) navigate("/forgot-password", { replace: true });
  }, [email, otp, navigate]);

  const onReset = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (newPassword.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setErr("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, otp, newPassword });
      setMsg("Password reset successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 800);
    } catch (error) {
      setErr(error?.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h1 className="text-white text-2xl font-semibold mb-2">Reset Password</h1>
        <p className="text-slate-400 text-sm mb-6">
          Reset password for <span className="text-slate-200">{email}</span>
        </p>

        {msg && <div className="mb-4 text-green-300 text-sm">{msg}</div>}
        {err && <div className="mb-4 text-red-300 text-sm">{err}</div>}

        <form onSubmit={onReset} className="space-y-4">
          <div>
            <label className="text-slate-300 text-sm">New Password</label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 text-white border border-slate-700 outline-none focus:border-slate-500"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              type="password"
              required
            />
          </div>

          <div>
            <label className="text-slate-300 text-sm">Confirm Password</label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 text-white border border-slate-700 outline-none focus:border-slate-500"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password"
              type="password"
              required
            />
          </div>

          <button
            disabled={loading}
            className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
