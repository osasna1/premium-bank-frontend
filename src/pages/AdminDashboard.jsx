import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const [tab, setTab] = useState("users"); // users | transactions

  const [users, setUsers] = useState([]);
  const [tx, setTx] = useState([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Create customer form
  const [customerEmail, setCustomerEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [createChequing, setCreateChequing] = useState(true);
  const [createSavings, setCreateSavings] = useState(true);
  const [chequingOpening, setChequingOpening] = useState(0);
  const [savingsOpening, setSavingsOpening] = useState(0);

  // tx filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [direction, setDirection] = useState("");

  const formatMoney = (n) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
      Number(n || 0)
    );

  const onLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/login");
  };

  const loadUsers = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data?.users || []); // ✅ backend returns { users: [...] }
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadTx = async (p = 1) => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/admin/transactions", {
        params: { page: p, limit: 15, search, type, direction },
      });
      setTx(res.data?.items || []);
      setTotalPages(res.data?.totalPages || 1);
      setPage(p);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "users") loadUsers();
    if (tab === "transactions") loadTx(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const applyTxFilters = () => loadTx(1);

  const createCustomer = async () => {
    setErr("");

    const email = String(customerEmail).trim().toLowerCase();
    const name = String(fullName).trim();

    if (!email) return setErr("Customer email is required");
    if (!password || password.length < 6) return setErr("Password must be at least 6 characters");
    if (password !== confirmPassword) return setErr("Passwords do not match");
    if (!createChequing && !createSavings) return setErr("Select at least one account type");

    try {
      setLoading(true);

      await api.post("/admin/create-customer", {
        email,
        password,
        fullName: name || "New Customer",
        createChequing,
        createSavings,
        chequingOpening: Number(chequingOpening) || 0,
        savingsOpening: Number(savingsOpening) || 0,
      });

      // clear form
      setCustomerEmail("");
      setFullName("");
      setPassword("");
      setConfirmPassword("");
      setChequingOpening(0);
      setSavingsOpening(0);
      setCreateChequing(true);
      setCreateSavings(true);

      await loadUsers();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to create customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="h-14 bg-pb-600 flex items-center px-6 justify-between">
        <div className="flex items-center gap-3 text-white">
          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
            PB
          </div>
          <div className="font-semibold tracking-wide">Premium Bank — Admin</div>
        </div>

        <div className="flex items-center gap-3 text-white/90">
          <span className="text-sm hidden sm:block">{user?.email || "Admin"}</span>

          <Link
            to="/dashboard"
            className="rounded-full bg-white/15 hover:bg-white/20 px-4 py-2 text-sm font-semibold"
          >
            Customer View
          </Link>

          <button
            onClick={onLogout}
            className="rounded-full bg-white/15 hover:bg-white/20 px-4 py-2 text-sm font-semibold"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6 flex gap-8 items-center h-12 text-sm font-semibold">
          <button
            onClick={() => setTab("users")}
            className={tab === "users" ? "text-pb-600 border-b-2 border-pb-600 pb-2" : "hover:text-pb-600"}
          >
            Users
          </button>

          <button
            onClick={() => setTab("transactions")}
            className={tab === "transactions" ? "text-pb-600 border-b-2 border-pb-600 pb-2" : "hover:text-pb-600"}
          >
            Transactions
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {err && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        )}

        {/* USERS */}
        {tab === "users" && (
          <div className="space-y-6">
            {/* Create Customer */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-900">Create Customer Account</h2>
              <p className="text-sm text-slate-500 mt-1">
                Admin sets customer email + first password + opening balances.
              </p>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Customer Email</label>
                  <input
                    className="mt-1 w-full border rounded-xl p-3"
                    placeholder="customer@email.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">Full Name (optional)</label>
                  <input
                    className="mt-1 w-full border rounded-xl p-3"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">Create Password</label>
                  <input
                    type="password"
                    className="mt-1 w-full border rounded-xl p-3"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
                  <input
                    type="password"
                    className="mt-1 w-full border rounded-xl p-3"
                    placeholder="Re-type password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={createChequing}
                    onChange={() => setCreateChequing((v) => !v)}
                  />
                  Chequing
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={createSavings}
                    onChange={() => setCreateSavings((v) => !v)}
                  />
                  Savings
                </label>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Chequing Opening Balance</label>
                  <input
                    type="number"
                    className="mt-1 w-full border rounded-xl p-3"
                    value={chequingOpening}
                    onChange={(e) => setChequingOpening(e.target.value)}
                    disabled={!createChequing}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">Savings Opening Balance</label>
                  <input
                    type="number"
                    className="mt-1 w-full border rounded-xl p-3"
                    value={savingsOpening}
                    onChange={(e) => setSavingsOpening(e.target.value)}
                    disabled={!createSavings}
                  />
                </div>
              </div>

              <div className="mt-5">
                <button
                  onClick={createCustomer}
                  disabled={loading}
                  className="rounded-xl bg-pb-600 text-white px-5 py-3 text-sm font-semibold hover:bg-pb-700 disabled:opacity-60"
                >
                  {loading ? "Creating..." : "Create Customer"}
                </button>
              </div>
            </div>

            {/* Users List */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Customers</h2>
                <button
                  onClick={loadUsers}
                  className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Refresh Users
                </button>
              </div>

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
                    {loading ? (
                      <tr><td className="p-3" colSpan="4">Loading...</td></tr>
                    ) : users.length === 0 ? (
                      <tr><td className="p-3" colSpan="4">No users found.</td></tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u._id} className="border-t">
                          <td className="p-3 font-medium">{u.fullName || "—"}</td>
                          <td className="p-3">{u.email}</td>
                          <td className="p-3 capitalize">{u.status || "active"}</td>
                          <td className="p-3">{u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TRANSACTIONS */}
        {tab === "transactions" && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-slate-900">Transactions</h2>

              <button
                onClick={() => loadTx(1)}
                className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>

            {/* Filters */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                className="border rounded-xl p-2"
                placeholder="Search reference/description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select className="border rounded-xl p-2" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">All Types</option>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="transfer">Transfer</option>
              </select>

              <select className="border rounded-xl p-2" value={direction} onChange={(e) => setDirection(e.target.value)}>
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
                    <th className="p-3">Type</th>
                    <th className="p-3">Direction</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Reference</th>
                    <th className="p-3">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td className="p-3" colSpan="6">Loading...</td></tr>
                  ) : tx.length === 0 ? (
                    <tr><td className="p-3" colSpan="6">No transactions found.</td></tr>
                  ) : (
                    tx.map((t) => (
                      <tr key={t._id} className="border-t">
                        <td className="p-3">{t.createdAt ? new Date(t.createdAt).toLocaleString() : "-"}</td>
                        <td className="p-3 capitalize">{t.type}</td>
                        <td className="p-3 capitalize">{t.direction}</td>
                        <td className="p-3 font-semibold">{formatMoney(t.amount)}</td>
                        <td className="p-3">{t.reference || "-"}</td>
                        <td className="p-3">{t.description || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <button
                className="border rounded-xl px-4 py-2 disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => loadTx(page - 1)}
              >
                Prev
              </button>

              <div className="text-sm">
                Page <b>{page}</b> of <b>{totalPages}</b>
              </div>

              <button
                className="border rounded-xl px-4 py-2 disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => loadTx(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
