import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";

export default function BillsPage() {
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    accountId: "",
    amount: "",
    billerName: "",
    referenceNumber: "",
    description: "Bill payment",
  });

  const formatMoney = (value) => {
    const n = Number(value || 0);
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(n);
  };

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await api.get("/accounts");
        setAccounts(Array.isArray(res.data) ? res.data : []);
      } catch {
        setErr("Failed to load accounts");
      } finally {
        setLoadingAccounts(false);
      }
    };
    fetchAccounts();
  }, []);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a._id === form.accountId),
    [accounts, form.accountId]
  );

  const payBill = async () => {
    setErr("");
    setMsg("");

    if (!form.accountId) return setErr("Select account.");
    if (!form.amount || Number(form.amount) <= 0)
      return setErr("Enter valid amount.");
    if (!form.billerName.trim())
      return setErr("Enter biller name.");
    if (!form.referenceNumber.trim())
      return setErr("Enter reference number.");

    try {
      setLoading(true);

      await api.post("/transactions/bill-payment", form);

      setMsg("Bill payment successful ✅");

      setForm({
        accountId: "",
        amount: "",
        billerName: "",
        referenceNumber: "",
        description: "Bill payment",
      });

      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (e) {
      setErr(e?.response?.data?.message || "Payment failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm font-semibold text-slate-600 hover:underline"
      >
        ← Back
      </button>

      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Bill Payment</h2>

        {msg && (
          <div className="mb-3 p-3 bg-green-50 text-green-700 rounded">
            {msg}
          </div>
        )}

        {err && (
          <div className="mb-3 p-3 bg-red-50 text-red-700 rounded">
            {err}
          </div>
        )}

        <select
          className="w-full border p-2 mb-3 rounded"
          value={form.accountId}
          onChange={(e) =>
            setForm({ ...form, accountId: e.target.value })
          }
        >
          <option value="">Select account</option>
          {accounts.map((a) => (
            <option key={a._id} value={a._id}>
              {a.type} • {a.accountNumber} • {formatMoney(a.balance)}
            </option>
          ))}
        </select>

        {selectedAccount && (
          <div className="text-xs text-slate-500 mb-3">
            From: {selectedAccount.accountNumber}
          </div>
        )}

        <input
          placeholder="Amount"
          className="w-full border p-2 mb-3 rounded"
          value={form.amount}
          onChange={(e) =>
            setForm({ ...form, amount: e.target.value })
          }
        />

        <input
          placeholder="Biller Name"
          className="w-full border p-2 mb-3 rounded"
          value={form.billerName}
          onChange={(e) =>
            setForm({ ...form, billerName: e.target.value })
          }
        />

        <input
          placeholder="Reference Number"
          className="w-full border p-2 mb-4 rounded"
          value={form.referenceNumber}
          onChange={(e) =>
            setForm({ ...form, referenceNumber: e.target.value })
          }
        />

        <button
          onClick={payBill}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700"
        >
          {loading ? "Processing..." : "Pay Bill"}
        </button>
      </div>
    </div>
  );
}