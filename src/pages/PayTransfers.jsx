import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function PayTransfers() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [err, setErr] = useState("");

  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const formatMoney = (value) => {
    const n = Number(value || 0);
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  };

  const formatAccLabel = (a) => {
    const type = (a.type || "").toUpperCase();
    const accNo = a.accountNumber || "";
    return `${type} • ${accNo} • ${formatMoney(a.balance)}`;
  };

  const pickCheckingId = (list) =>
    list.find((a) => (a.type || "").toLowerCase().includes("cheq"))?._id ||
    list[0]?._id ||
    "";

  const pickSavingsId = (list) =>
    list.find((a) => (a.type || "").toLowerCase().includes("sav"))?._id ||
    list[1]?._id ||
    list[0]?._id ||
    "";

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    setErr("");
    try {
      const res = await api.get("/accounts");
      const list = Array.isArray(res.data) ? res.data : [];
      setAccounts(list);

      if (list.length) {
        const checkingId = pickCheckingId(list);
        const savingsId = pickSavingsId(list);
        setFromAccountId(checkingId);
        setToAccountId(savingsId);
      }
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load accounts");
      setAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      navigate("/admin", { replace: true });
      return;
    }
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const validateAmount = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return { ok: false, num: 0, msg: "Enter a valid amount > 0" };
    return { ok: true, num, msg: "" };
  };

  const onTransfer = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!fromAccountId || !toAccountId) return setErr("Please select both accounts");
    if (fromAccountId === toAccountId) return setErr("From and To accounts must be different");

    const { ok, num, msg } = validateAmount(amount);
    if (!ok) return setErr(msg);

    setLoading(true);
    try {
      await api.post("/transactions/transfer", {
        fromAccountId,
        toAccountId,
        amount: num,
        description: "Account transfer",
      });

      setMsg("✅ Transfer successful");
      setAmount("");
      await fetchAccounts();
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Account transfers</h1>
            <p className="text-sm text-slate-600 mt-1">Move money between your accounts.</p>
          </div>

          <button
            onClick={fetchAccounts}
            className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {err && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}
        {msg && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {msg}
          </div>
        )}

        {loadingAccounts ? (
          <p className="mt-4 text-slate-600">Loading accounts...</p>
        ) : (
          <form onSubmit={onTransfer} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">From</label>
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-pb-600"
              >
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {formatAccLabel(a)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">To</label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-pb-600"
              >
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {formatAccLabel(a)}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Amount</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                min="1"
                step="1"
                placeholder="100"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-pb-600"
              />
            </div>

            <div className="md:col-span-2">
              <button
                disabled={loading}
                className="w-full rounded-full bg-pb-600 text-white py-3 font-semibold hover:bg-pb-700 disabled:opacity-60"
              >
                {loading ? "Processing..." : "TRANSFER"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
