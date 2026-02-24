import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

function localDatetimeToISO(localValue) {
  // localValue: "YYYY-MM-DDTHH:mm" (no timezone)
  // Convert to a local Date safely, then to ISO.
  if (!localValue) return undefined;

  const [d, t] = String(localValue).split("T");
  if (!d || !t) return undefined;

  const [y, m, day] = d.split("-").map(Number);
  const [hh, mm] = t.split(":").map(Number);

  const dt = new Date(y, m - 1, day, hh, mm, 0, 0); // LOCAL time
  if (Number.isNaN(dt.getTime())) return undefined;

  return dt.toISOString();
}

export default function AdminPanel() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  // ===== CREATE CUSTOMER FORM =====
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [chequing, setChequing] = useState(true);
  const [savings, setSavings] = useState(true);
  const [chequingOpening, setChequingOpening] = useState(0);
  const [savingsOpening, setSavingsOpening] = useState(0);

  // ✅ Backdate datetime (local input value) e.g. "2016-05-10T09:30"
  const [postedAtLocal, setPostedAtLocal] = useState("");

  // ===== DATA =====
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [tx, setTx] = useState([]);

  // ===== TRANSACTION FILTERS =====
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [txSearch, setTxSearch] = useState("");
  const [txType, setTxType] = useState("");
  const [txDirection, setTxDirection] = useState("");

  // ===== LOADING + ERRORS =====
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingTx, setLoadingTx] = useState(false);

  const [errCustomers, setErrCustomers] = useState("");
  const [errAccounts, setErrAccounts] = useState("");
  const [errTx, setErrTx] = useState("");
  const [errCreate, setErrCreate] = useState("");
  const [msg, setMsg] = useState("");

  // ✅ per-row update state
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const formatMoney = (n) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
      Number(n || 0)
    );

  // ✅ show backdated date in admin tx list too
  const formatTxDate = (t) => {
    const d = t?.postedAt || t?.createdAt;
    if (!d) return "-";
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? "-" : dt.toLocaleString();
  };

  const onLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  // helper: supports MANY backend response shapes
  const unwrapList = (payload, keys = []) => {
    if (Array.isArray(payload)) return payload;
    for (const k of keys) {
      if (Array.isArray(payload?.[k])) return payload[k];
    }
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  };

  // ✅ UI helper: show CHECKING instead of chequing (display only)
  const displayAccountType = (type) => {
    const t = String(type || "").toLowerCase();
    if (t === "chequing") return "CHECKING";
    return String(type || "").toUpperCase();
  };

  // ===== LOADERS =====
  const loadCustomers = async () => {
    setLoadingCustomers(true);
    setErrCustomers("");
    try {
      const res = await api.get("/admin/users");
      const list = unwrapList(res.data, ["users", "customers"]);
      const mapped = list.map((c) => ({
        _id: c._id || c.id,
        fullName: c.fullName || c.name || "",
        email: c.email || "",
        status: String(c.status || "active").toLowerCase(),
        createdAt: c.createdAt || c.created_at || null,
        role: c.role || "customer",
      }));
      setCustomers(mapped);
    } catch (e) {
      setCustomers([]);
      setErrCustomers(e?.response?.data?.message || "Failed to load customers");
    } finally {
      setLoadingCustomers(false);
    }
  };

  const loadAccounts = async () => {
    setLoadingAccounts(true);
    setErrAccounts("");
    try {
      const res = await api.get("/admin/accounts");
      const list = unwrapList(res.data, ["accounts"]);
      const mapped = list.map((a) => ({
        _id: a._id || a.id,
        accountNumber: a.accountNumber || a.account_no || "",
        type: a.type || "",
        balance: a.balance ?? 0,
        createdAt: a.createdAt || null,
        userId: a.userId?._id || a.userId || a.user || null,
        userEmail: a.userEmail || a.userId?.email || a.ownerEmail || "",
        userName: a.userName || a.userId?.fullName || a.userId?.name || a.ownerName || "",
      }));
      setAccounts(mapped);
    } catch (e) {
      setAccounts([]);
      setErrAccounts(e?.response?.data?.message || "Failed to load accounts");
    } finally {
      setLoadingAccounts(false);
    }
  };

  const loadTransactions = async (page = txPage) => {
    setLoadingTx(true);
    setErrTx("");
    try {
      const res = await api.get("/admin/transactions", {
        params: { page, limit: 20, search: txSearch, type: txType, direction: txDirection },
      });

      const items = Array.isArray(res.data?.items)
        ? res.data.items
        : unwrapList(res.data, ["transactions"]);

      const mapped = items.map((t) => ({
        _id: t._id || t.id,
        createdAt: t.createdAt || null,
        postedAt: t.postedAt || null,
        type: t.type || "",
        direction: t.direction || "",
        amount: t.amount ?? 0,
        reference: t.reference || "",
        description: t.description || "",
        userEmail: t.userEmail || t.userId?.email || "",
        accountNumber: t.accountNumber || t.accountId?.accountNumber || "",
      }));

      setTx(mapped);
      setTxTotalPages(Number(res.data?.totalPages || 1));
    } catch (e) {
      setTx([]);
      setTxTotalPages(1);
      setErrTx(e?.response?.data?.message || "Failed to load transactions");
    } finally {
      setLoadingTx(false);
    }
  };

  // Toggle Active <-> Disabled
  const toggleUserStatus = async (customer) => {
    const id = customer?._id;
    if (!id) return;

    const current = String(customer.status || "active").toLowerCase();
    const nextStatus = current === "active" ? "disabled" : "active";

    setUpdatingUserId(id);
    setErrCustomers("");
    setMsg("");

    try {
      await api.patch(`/admin/users/${id}/status`, { status: nextStatus });

      setCustomers((prev) =>
        prev.map((c) => (String(c._id) === String(id) ? { ...c, status: nextStatus } : c))
      );

      setMsg(`User status updated to ${nextStatus} ✅`);
    } catch (e) {
      setErrCustomers(e?.response?.data?.message || "Failed to update user status");
    } finally {
      setUpdatingUserId(null);
    }
  };

  // load SEQUENTIALLY
  useEffect(() => {
    (async () => {
      await loadCustomers();
      await loadAccounts();
      await loadTransactions(1);
      setTxPage(1);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadTransactions(txPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txPage]);

  const applyTxFilters = () => {
    setTxPage(1);
    loadTransactions(1);
  };

  // ✅ Enable backdate only if opening balance > 0
  const anyOpeningAmount =
    (chequing ? Number(chequingOpening || 0) : 0) + (savings ? Number(savingsOpening || 0) : 0);

  // ===== CREATE CUSTOMER =====
  const createCustomer = async (e) => {
    e.preventDefault();
    setErrCreate("");
    setMsg("");

    const cleanEmail = String(email).trim().toLowerCase();
    if (!cleanEmail) return setErrCreate("Email is required");
    if (password.length < 6) return setErrCreate("Password must be at least 6 characters");
    if (password !== confirm) return setErrCreate("Passwords do not match");
    if (!chequing && !savings) return setErrCreate("Select at least one account type");

    // ✅ Convert datetime-local to ISO for backend (safe local->ISO)
    const openingDateISO = postedAtLocal ? localDatetimeToISO(postedAtLocal) : undefined;

    setLoadingCreate(true);
    try {
      await api.post("/admin/create-customer", {
        email: cleanEmail,
        fullName: String(fullName || "").trim(),
        password,
        createChequing: chequing,
        createSavings: savings,
        chequingOpening: Number(chequingOpening || 0),
        savingsOpening: Number(savingsOpening || 0),

        // ✅ NEW preferred field (backend also accepts old postedAt)
        ...(openingDateISO ? { openingDate: openingDateISO } : {}),
      });

      setMsg("Customer created successfully ✅");
      setEmail("");
      setFullName("");
      setPassword("");
      setConfirm("");
      setChequingOpening(0);
      setSavingsOpening(0);
      setPostedAtLocal("");

      await loadCustomers();
      await loadAccounts();
      await loadTransactions(1);
      setTxPage(1);
    } catch (e2) {
      setErrCreate(e2?.response?.data?.message || "Failed to create customer");
    } finally {
      setLoadingCreate(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* TOP BAR */}
      <div className="h-14 bg-pb-600 flex items-center px-6 justify-between">
        <div className="flex items-center gap-3 text-white">
          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
            PB
          </div>
          <div className="font-semibold tracking-wide">Premium Bank — Admin</div>

          {/* ✅ DEBUG BADGE so you know this file is showing */}
          <span className="ml-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
            BACKDATE ENABLED ✅
          </span>
        </div>

        <div className="flex items-center gap-3 text-white/90">
          <span className="text-sm hidden sm:block">{user?.email || "Admin"}</span>

          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-full bg-white/15 hover:bg-white/20 px-4 py-2 text-sm font-semibold"
          >
            Customer View
          </button>

          <button
            onClick={onLogout}
            className="rounded-full bg-white/15 hover:bg-white/20 px-4 py-2 text-sm font-semibold"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {msg && (
          <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {msg}
          </div>
        )}

        {errCreate && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errCreate}
          </div>
        )}

        {/* CREATE CUSTOMER */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900">Create Customer Account</h2>
          <p className="text-sm text-slate-500 mt-1">
            Admin sets customer email + first password + opening balances.
          </p>

          <form onSubmit={createCustomer} className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold">Customer Email</label>
              <input
                className="mt-1 w-full border rounded-xl p-3"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@email.com"
                type="email"
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Full Name (optional)</label>
              <input
                className="mt-1 w-full border rounded-xl p-3"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Create Password</label>
              <input
                className="mt-1 w-full border rounded-xl p-3"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                type="password"
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Confirm Password</label>
              <input
                className="mt-1 w-full border rounded-xl p-3"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-type password"
                type="password"
                required
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={chequing} onChange={() => setChequing((v) => !v)} />
                {/* ✅ UI only */}
                Checking
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={savings} onChange={() => setSavings((v) => !v)} />
                Savings
              </label>
            </div>

            <div>
              <label className="text-sm font-semibold">Checking Opening Balance</label>
              <input
                className="mt-1 w-full border rounded-xl p-3"
                value={chequingOpening}
                onChange={(e) => setChequingOpening(e.target.value)}
                type="number"
                min="0"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Savings Opening Balance</label>
              <input
                className="mt-1 w-full border rounded-xl p-3"
                value={savingsOpening}
                onChange={(e) => setSavingsOpening(e.target.value)}
                type="number"
                min="0"
              />
            </div>

            {/* ✅ BACKDATE FIELD */}
            <div className="md:col-span-2">
              <label className="text-sm font-semibold">
                Opening Deposit Date/Time (Backdate){" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>

              <input
                className="mt-1 w-full border rounded-xl p-3"
                value={postedAtLocal}
                onChange={(e) => setPostedAtLocal(e.target.value)}
                type="datetime-local"
                disabled={anyOpeningAmount <= 0}
              />

              {anyOpeningAmount <= 0 ? (
                <p className="text-xs text-slate-500 mt-1">
                  Add an opening balance above to enable backdating.
                </p>
              ) : (
                <p className="text-xs text-slate-500 mt-1">Leave empty to use today’s date/time.</p>
              )}
            </div>

            <div className="md:col-span-2">
              <button
                disabled={loadingCreate}
                className="rounded-xl bg-pb-600 text-white px-5 py-3 font-semibold hover:bg-pb-700 disabled:opacity-60"
              >
                {loadingCreate ? "Creating..." : "Create Customer"}
              </button>
            </div>
          </form>
        </div>

        {/* CUSTOMERS */}
        <div className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Customers</h2>
            <button
              onClick={loadCustomers}
              className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {loadingCustomers ? "Refreshing..." : "Refresh Users"}
            </button>
          </div>

          {errCustomers && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errCustomers}
            </div>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr className="text-left">
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {loadingCustomers ? (
                  <tr>
                    <td className="p-3" colSpan="4">
                      Loading...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td className="p-3" colSpan="4">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => {
                    const status = String(c.status || "active").toLowerCase();
                    const isActive = status === "active";
                    const isUpdating = updatingUserId === c._id;

                    return (
                      <tr key={c._id} className="border-t">
                        <td className="p-3">{c.fullName || "—"}</td>
                        <td className="p-3">{c.email}</td>

                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <span
                              className={
                                "capitalize inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold " +
                                (isActive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-slate-200 text-slate-700")
                              }
                            >
                              {isActive ? "Active" : "Disabled"}
                            </span>

                            <button
                              disabled={isUpdating}
                              onClick={() => toggleUserStatus(c)}
                              className={
                                "rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:opacity-60 " +
                                (isActive
                                  ? "border-red-200 text-red-700"
                                  : "border-green-200 text-green-700")
                              }
                              title={isActive ? "Disable this user" : "Activate this user"}
                            >
                              {isUpdating ? "Updating..." : isActive ? "Disable" : "Activate"}
                            </button>
                          </div>
                        </td>

                        <td className="p-3">
                          {c.createdAt ? new Date(c.createdAt).toLocaleString() : "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ACCOUNTS */}
        <div className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Accounts</h2>
            <button
              onClick={loadAccounts}
              className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {loadingAccounts ? "Refreshing..." : "Refresh Accounts"}
            </button>
          </div>

          {errAccounts && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errAccounts}
            </div>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr className="text-left">
                  <th className="p-3">Owner</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Account No</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Balance</th>
                </tr>
              </thead>
              <tbody>
                {loadingAccounts ? (
                  <tr>
                    <td className="p-3" colSpan="5">
                      Loading...
                    </td>
                  </tr>
                ) : accounts.length === 0 ? (
                  <tr>
                    <td className="p-3" colSpan="5">
                      No accounts found.
                    </td>
                  </tr>
                ) : (
                  accounts.map((a) => (
                    <tr key={a._id} className="border-t">
                      <td className="p-3">{a.userName || "—"}</td>
                      <td className="p-3">{a.userEmail || "—"}</td>
                      <td className="p-3 font-mono">{a.accountNumber}</td>
                      <td className="p-3">{displayAccountType(a.type)}</td>
                      <td className="p-3 font-semibold">{formatMoney(a.balance)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TRANSACTIONS */}
        <div className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">All Transactions</h2>
            <button
              onClick={() => loadTransactions(1)}
              className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {loadingTx ? "Refreshing..." : "Refresh Transactions"}
            </button>
          </div>

          {errTx && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errTx}
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              className="border rounded-xl p-2"
              placeholder="Search reference/description..."
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
            />
            <select
              className="border rounded-xl p-2"
              value={txType}
              onChange={(e) => setTxType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="transfer">Transfer</option>
              <option value="wire">Wire</option>
              <option value="bill">Bill</option>
            </select>
            <select
              className="border rounded-xl p-2"
              value={txDirection}
              onChange={(e) => setTxDirection(e.target.value)}
            >
              <option value="">All Directions</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
            <button
              onClick={applyTxFilters}
              className="rounded-xl bg-pb-600 text-white p-2 font-semibold hover:bg-pb-700"
            >
              Apply
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr className="text-left">
                  <th className="p-3">Date</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Direction</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Account</th>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Description</th>
                </tr>
              </thead>
              <tbody>
                {loadingTx ? (
                  <tr>
                    <td className="p-3" colSpan="8">
                      Loading...
                    </td>
                  </tr>
                ) : tx.length === 0 ? (
                  <tr>
                    <td className="p-3" colSpan="8">
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  tx.map((t) => (
                    <tr key={t._id} className="border-t">
                      <td className="p-3">{formatTxDate(t)}</td>
                      <td className="p-3">{t.userEmail || "-"}</td>
                      <td className="p-3 capitalize">{t.type}</td>
                      <td className="p-3 capitalize">{t.direction}</td>
                      <td className="p-3 font-semibold">{formatMoney(t.amount)}</td>
                      <td className="p-3 font-mono">{t.accountNumber || "-"}</td>
                      <td className="p-3">{t.reference || "-"}</td>
                      <td className="p-3">{t.description || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              className="border rounded-xl px-4 py-2 disabled:opacity-40"
              disabled={txPage <= 1}
              onClick={() => setTxPage((p) => p - 1)}
            >
              Prev
            </button>
            <div className="text-sm">
              Page <b>{txPage}</b> of <b>{txTotalPages}</b>
            </div>
            <button
              className="border rounded-xl px-4 py-2 disabled:opacity-40"
              disabled={txPage >= txTotalPages}
              onClick={() => setTxPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}