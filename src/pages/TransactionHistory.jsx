import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";

export default function TransactionHistory() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const isAdmin = (user?.role || "").toLowerCase() === "admin";
  const accountId = params.get("accountId") || "";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const shortId = (val) => {
    if (!val) return "—";
    const id = typeof val === "object" ? val?._id : val;
    if (!id) return "—";
    const s = String(id);
    return s.length > 12 ? `${s.slice(0, 6)}...${s.slice(-4)}` : s;
  };

  const accountDisplay = (t) => {
    if (t?.accountNumber) return t.accountNumber;
    if (t?.accountId && typeof t.accountId === "object") {
      return t.accountId.accountNumber || shortId(t.accountId);
    }
    return shortId(t?.accountId);
  };

  const relatedAccountDisplay = (t) => {
    if (t?.relatedAccountNumber) return t.relatedAccountNumber;
    if (t?.relatedAccountId && typeof t.relatedAccountId === "object") {
      return t.relatedAccountId.accountNumber || shortId(t.relatedAccountId);
    }
    return shortId(t?.relatedAccountId);
  };

  const userDisplay = (t) => {
    if (t?.userEmail) return t.userEmail;
    if (t?.userId && typeof t.userId === "object") {
      return t.userId.email || shortId(t.userId);
    }
    return shortId(t?.userId);
  };

  // ✅ PROPER DATE FORMAT (postedAt first, fallback to createdAt)
  const formatTxDate = (t) => {
    const dateValue = t?.postedAt || t?.createdAt;
    if (!dateValue) return "—";

    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return "—";

    return d.toLocaleString();
  };

  const load = async () => {
    setLoading(true);
    setErr("");

    try {
      const url = isAdmin ? "/admin/transactions" : "/transactions";

      const res = await api.get(url, {
        params: accountId ? { accountId } : {},
      });

      setItems(res.data?.items || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, isAdmin]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="h-14 bg-pb-600 flex items-center px-6 justify-between">
        <div className="text-white font-semibold">
          {isAdmin ? "All Transactions (Admin)" : "Your Transactions"}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="rounded-full bg-white/15 hover:bg-white/20 px-4 py-2 text-sm font-semibold text-white"
          >
            Refresh
          </button>

          <button
            onClick={() => navigate(isAdmin ? "/admin" : "/dashboard")}
            className="rounded-full bg-white/15 hover:bg-white/20 px-4 py-2 text-sm font-semibold text-white"
          >
            Back
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {accountId && (
          <div className="mb-4 text-sm text-slate-600">
            Showing transactions for account:{" "}
            <span className="font-mono">{accountId}</span>
          </div>
        )}

        {err && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left">
                <th className="p-3">Date</th>
                <th className="p-3">Type</th>
                <th className="p-3">Direction</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Account</th>
                <th className="p-3">Related</th>
                {isAdmin && <th className="p-3">User</th>}
                <th className="p-3">Description</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="p-3" colSpan={isAdmin ? 8 : 7}>
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="p-3" colSpan={isAdmin ? 8 : 7}>
                    No transactions found.
                  </td>
                </tr>
              ) : (
                items.map((t) => (
                  <tr key={t._id} className="border-t">
                    <td className="p-3">{formatTxDate(t)}</td>

                    <td className="p-3 capitalize">{t.type || "—"}</td>

                    <td className="p-3 capitalize">{t.direction || "—"}</td>

                    <td className="p-3 font-semibold">
                      ${Number(t.amount || 0).toFixed(2)}
                    </td>

                    <td className="p-3 font-mono">{accountDisplay(t)}</td>

                    <td className="p-3 font-mono">{relatedAccountDisplay(t)}</td>

                    {isAdmin && <td className="p-3">{userDisplay(t)}</td>}

                    <td className="p-3">{t.description || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}