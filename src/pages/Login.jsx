import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onLogin = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const payload = {
        email: String(email).trim().toLowerCase(),
        password: String(password),
      };

      // ✅ FIXED ROUTE HERE
      const res = await api.post("/auth/login", payload);

      const token = res?.data?.token;
      const user = res?.data?.user;

      if (!token || !user) throw new Error("Login response missing token/user");

      if (remember) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
      } else {
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("user", JSON.stringify(user));
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }

      const role = String(user?.role || "").toLowerCase();
      navigate(role === "admin" ? "/admin" : "/dashboard", { replace: true });
    } catch (e2) {
      const msg =
        e2?.response?.data?.message ||
        e2?.message ||
        "Login failed";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-pb-600 h-14 flex items-center px-6">
        <span className="text-white text-xl font-bold tracking-wide">
          Premium Bank
        </span>
      </div>

      <div className="flex justify-center mt-12 px-4">
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl w-full">
          <div className="bg-white p-8 rounded-xl shadow">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              🔒 Sign in
            </h2>

            {err && (
              <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                {err}
              </div>
            )}

            <form onSubmit={onLogin} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                className="w-full border rounded-lg p-3"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <input
                type="password"
                placeholder="Password"
                className="w-full border rounded-lg p-3"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />

              <div className="flex items-center gap-2">
                <input
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={() => setRemember((v) => !v)}
                />
                <label htmlFor="remember" className="text-sm">
                  Remember me
                </label>
              </div>

              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-pb-600 hover:underline"
              >
                Forgot your password or Login ID?
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-pb-600 text-white rounded-full py-3 font-semibold hover:bg-pb-700 disabled:opacity-60"
              >
                {loading ? "Signing in..." : "SIGN IN"}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="font-semibold mb-2">
                Register a new card for online banking
              </h3>

              <button
                type="button"
                className="text-pb-600 font-semibold cursor-pointer hover:underline"
                onClick={() => navigate("/register")}
              >
                DEBIT CARD
              </button>

              <p className="text-gray-500 text-sm">or</p>

              <button
                type="button"
                className="text-pb-600 font-semibold cursor-pointer hover:underline"
                onClick={() => navigate("/register")}
              >
                CREDIT CARD
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="font-bold mb-2">
                🔒 Your security always comes first
              </h3>

              <p className="text-gray-600 text-sm">
                We use advanced banking security technology to keep your money
                and personal information safe.
              </p>

              <p className="mt-3 text-pb-600 text-sm cursor-pointer hover:underline">
                Learn more about how we protect you →
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}