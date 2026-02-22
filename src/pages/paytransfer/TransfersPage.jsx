import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";

export default function TransfersPage() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("make"); // "make" | "activity"
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [transferType, setTransferType] = useState("one-time"); // one-time | recurring | custom

  const [form, setForm] = useState({
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    description: "Account transfer",
  });

  // ✅ prevent multiple redirects
  const redirectedRef = useRef(false);

  const formatMoney = (value) => {
    const n = Number(value || 0);
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  };

  const fetchAccounts = async () => {
    setErr("");
    try {
      const res = await api.get("/accounts");
      const list = Array.isArray(res.data) ? res.data : [];

      // ✅ only chequing/savings
      const filtered = list.filter((a) =>
        ["chequing", "savings"].includes(String(a.type || "").toLowerCase())
      );

      setAccounts(filtered);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load accounts");
      setAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fromAcc = useMemo(
    () => accounts.find((a) => a._id === form.fromAccountId),
    [accounts, form.fromAccountId]
  );

  const toAcc = useMemo(
    () => accounts.find((a) => a._id === form.toAccountId),
    [accounts, form.toAccountId]
  );

  const canContinue =
    form.fromAccountId &&
    form.toAccountId &&
    form.fromAccountId !== form.toAccountId &&
    Number(form.amount) > 0 &&
    form.date;

  const onContinue = async () => {
    setErr("");
    setMsg("");

    if (!form.fromAccountId) return setErr("You need to choose a From account.");
    if (!form.toAccountId) return setErr("You need to choose a To account.");
    if (form.fromAccountId === form.toAccountId)
      return setErr("From and To accounts cannot be the same.");

    const amt = Number(form.amount);
    if (!form.amount || !Number.isFinite(amt) || amt <= 0)
      return setErr("Enter a valid amount.");

    try {
      setLoading(true);

      // ✅ REAL BACKEND TRANSFER
      const payload = {
        fromAccountId: form.fromAccountId,
        toAccountId: form.toAccountId,
        amount: amt,
        description: form.description || "Transfer",
      };

      const res = await api.post("/transactions/transfer", payload);

      // Backend returns { message, reference, from, to, transactions }
      const reference = res?.data?.reference;

      setMsg(
        reference
          ? `Transfer successful ✅ (Ref: ${reference})`
          : "Transfer successful ✅"
      );

      // ✅ refresh accounts to show updated balances
      await fetchAccounts();

      // ✅ reset amount
      setForm((p) => ({ ...p, amount: "" }));

      // ✅ auto redirect to dashboard (Option 1)
      if (!redirectedRef.current) {
        redirectedRef.current = true;
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 1500);
      }
    } catch (e) {
      const backendMsg = e?.response?.data?.message;
      const status = e?.response?.status;

      setErr(
        backendMsg ||
          (status ? `Transfer failed (HTTP ${status})` : "") ||
          e?.message ||
          "Transfer failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Account transfers
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Move money between your accounts.
          </p>
        </div>

        <button
          type="button"
          className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
          onClick={() => window.print()}
          title="Print"
        >
          🖨️ PRINT
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-4 border-b border-slate-200">
        <div className="flex gap-6">
          <button
            type="button"
            onClick={() => setTab("make")}
            className={`pb-3 text-sm font-semibold ${
              tab === "make"
                ? "text-pb-600 border-b-2 border-pb-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Make a transfer
          </button>

          <button
            type="button"
            onClick={() => setTab("activity")}
            className={`pb-3 text-sm font-semibold ${
              tab === "activity"
                ? "text-pb-600 border-b-2 border-pb-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Transfer activity
          </button>
        </div>
      </div>

      {tab === "activity" ? (
        <div className="mt-6 rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
          <p className="text-sm text-slate-600">
            Transfer activity will show here (we’ll connect it to your
            transactions table next).
          </p>

          <button
            type="button"
            className="mt-4 rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            onClick={() => navigate("/transactions")}
          >
            View transactions
          </button>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-900">
            Your transfer details
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            All fields are required unless we’ve marked them optional.
          </p>

          {msg && (
            <div className="mt-4 rounded-lg bg-green-50 text-green-700 px-4 py-3 text-sm">
              {msg}
            </div>
          )}

          {err && (
            <div className="mt-4 rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">
              {err}
            </div>
          )}

          {/* From */}
          <div className="mt-6">
            <label className="text-xs font-semibold text-slate-700">From</label>
            <select
              className={`mt-1 w-full rounded-lg border px-3 py-2 ${
                err && !form.fromAccountId ? "border-red-300" : "border-slate-200"
              }`}
              value={form.fromAccountId}
              onChange={(e) =>
                setForm((p) => ({ ...p, fromAccountId: e.target.value }))
              }
              disabled={loadingAccounts || loading}
            >
              <option value="">Choose an account</option>
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>
                  {(a.type || "").toUpperCase()} • {a.accountNumber} •{" "}
                  {formatMoney(a.balance)}
                </option>
              ))}
            </select>
          </div>

          {/* To */}
          <div className="mt-5">
            <label className="text-xs font-semibold text-slate-700">To</label>
            <select
              className={`mt-1 w-full rounded-lg border px-3 py-2 ${
                err && !form.toAccountId ? "border-red-300" : "border-slate-200"
              }`}
              value={form.toAccountId}
              onChange={(e) =>
                setForm((p) => ({ ...p, toAccountId: e.target.value }))
              }
              disabled={loadingAccounts || loading}
            >
              <option value="">Choose an account</option>
              {accounts
                .filter((a) => a._id !== form.fromAccountId)
                .map((a) => (
                  <option key={a._id} value={a._id}>
                    {(a.type || "").toUpperCase()} • {a.accountNumber} •{" "}
                    {formatMoney(a.balance)}
                  </option>
                ))}
            </select>
          </div>

          {/* Amount */}
          <div className="mt-5">
            <label className="text-xs font-semibold text-slate-700">Amount</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              disabled={loading}
              inputMode="decimal"
            />
            <p className="mt-1 text-[11px] text-slate-500">Format: 0.00</p>
          </div>

          {/* Transfer type */}
          <div className="mt-6">
            <label className="text-xs font-semibold text-slate-700">
              Choose a transfer type
            </label>

            <div className="mt-2 grid grid-cols-3 rounded-lg border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setTransferType("one-time")}
                className={`py-2 text-sm font-semibold ${
                  transferType === "one-time"
                    ? "bg-pb-600 text-white"
                    : "bg-white hover:bg-slate-50"
                }`}
              >
                One-time
              </button>
              <button
                type="button"
                onClick={() => setTransferType("recurring")}
                className={`py-2 text-sm font-semibold border-l border-slate-200 ${
                  transferType === "recurring"
                    ? "bg-pb-600 text-white"
                    : "bg-white hover:bg-slate-50"
                }`}
              >
                Recurring
              </button>
              <button
                type="button"
                onClick={() => setTransferType("custom")}
                className={`py-2 text-sm font-semibold border-l border-slate-200 ${
                  transferType === "custom"
                    ? "bg-pb-600 text-white"
                    : "bg-white hover:bg-slate-50"
                }`}
              >
                Custom
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-600">
              {transferType === "one-time" && "Make this transfer once."}
              {transferType === "recurring" && "Repeat this transfer automatically."}
              {transferType === "custom" && "Set your own transfer schedule."}
            </p>
          </div>

          {/* Date */}
          <div className="mt-6">
            <label className="text-xs font-semibold text-slate-700">Date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              disabled={loading}
            />
            <p className="mt-2 text-xs text-slate-500">
              Heads up: We use Eastern Time for processing of all payments and transfers.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-7 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              {fromAcc && toAcc ? (
                <>
                  From <span className="font-semibold">{fromAcc.type}</span> to{" "}
                  <span className="font-semibold">{toAcc.type}</span>
                </>
              ) : (
                "Select From and To accounts to continue."
              )}
            </div>

            <button
              type="button"
              onClick={onContinue}
              disabled={!canContinue || loading}
              className="rounded-full bg-pb-600 px-6 py-2 text-sm font-semibold text-white hover:bg-pb-700 disabled:opacity-50"
            >
              {loading ? "Processing..." : "CONTINUE"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}