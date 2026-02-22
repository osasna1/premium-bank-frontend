import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onRegister = async (e) => {
    e.preventDefault();
    setErr("");

    // ✅ Frontend validation (so you never send empty values)
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setErr("fullName, email, password are required");
      return;
    }

    setLoading(true);
    try {
      // ✅ Send BOTH "fullName" and "name" to match any backend
      const payload = {
        fullName: fullName.trim(),
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
      };

      const res = await api.post("/auth/register", payload);

      // ✅ If backend returns token/user, save it. If not, just go login.
      if (res?.data?.token) localStorage.setItem("token", res.data.token);
      if (res?.data?.user) localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/login");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="h-14 bg-pb-600 flex items-center px-6">
        <div className="flex items-center gap-3 text-white">
          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
            PB
          </div>
          <span className="text-lg font-semibold tracking-wide">Premium Bank</span>
        </div>
      </div>

      {/* Card */}
      <div className="flex justify-center items-center mt-16 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-slate-200">
          <h1 className="text-2xl font-bold mb-2">Create account</h1>

          {err && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-4 text-sm">
              {err}
            </div>
          )}

          <form onSubmit={onRegister} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Full name</label>
              <input
                type="text"
                className="mt-1 w-full border rounded-xl p-3"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                className="mt-1 w-full border rounded-xl p-3"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email or Card number"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                className="mt-1 w-full border rounded-xl p-3"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pb-600 text-white rounded-full py-3 font-semibold hover:bg-pb-700 disabled:opacity-60"
            >
              {loading ? "Creating..." : "CREATE ACCOUNT"}
            </button>
          </form>

          <div className="text-center mt-5">
            <Link to="/login" className="text-sm text-pb-700 hover:underline">
              Back to Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
