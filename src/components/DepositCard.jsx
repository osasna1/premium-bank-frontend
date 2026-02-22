import { useState } from "react";
import { api } from "../lib/api";

export default function DepositCard({ accounts = [], onDone }) {
  const [accountId, setAccountId] = useState(accounts?.[0]?._id || "");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // If accounts load later, ensure accountId is set
  if (!accountId && accounts.length > 0) {
    setTimeout(() => setAccountId(accounts[0]._id), 0);
  }

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");

    const amt = Number(amount);
    if (!accountId) return setErr("Please select an account");
    if (!Number.isFinite(amt) || amt <= 0) return setErr("Enter a valid amount");

    setLoading(true);
    try {
      await api.post("/transactions/deposit", {
        accountId,
        amount: amt, // IMPORTANT: send as number
      });

      setMsg("Deposit successful ✅");
      setAmount("");

      // Refresh balances in dashboard
      onDone?.();
    } catch (error) {
      setErr(error?.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-slate-900">Deposit</h2>

      {msg && (
        <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          ✅ {msg}
        </div>
      )}
      {err && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      <form onSubmit={submit} className="mt-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Select account</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-pb-600"
          >
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {String(a.type || "").toUpperCase()} • {a.accountNumber} • $
                {Number(a.balance || 0).toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Amount</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-pb-600"
            placeholder="200"
            inputMode="decimal"
          />
        </div>

        <button
          disabled={loading}
          className="w-full rounded-full bg-pb-600 text-white py-3 font-semibold hover:bg-pb-700 disabled:opacity-60"
        >
          {loading ? "Processing..." : "DEPOSIT"}
        </button>
      </form>
    </div>
  );
}
