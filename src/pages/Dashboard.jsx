import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

/* ✅ Icon-only eye toggle */
function EyeIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.06 12.32C3.4 7.73 7.36 4.5 12 4.5c4.64 0 8.6 3.23 9.94 7.82.08.26.08.6 0 .86C20.6 16.77 16.64 20 12 20c-4.64 0-8.6-3.23-9.94-7.82a1.2 1.2 0 0 1 0-.86Z" />
      <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
    </svg>
  );
}

function EyeOffIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 2.42-4.42" />
      <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4.5c4.64 0 8.6 3.23 9.94 7.82.08.26.08.6 0 .86a10.8 10.8 0 0 1-2.18 3.85" />
      <path d="M6.1 6.1A10.9 10.9 0 0 0 2.06 12.32c-.08.26-.08.6 0 .86C3.4 16.77 7.36 20 12 20c1.2 0 2.36-.22 3.45-.62" />
      <path d="M2 2l20 20" />
    </svg>
  );
}

/* ✅ Reusable dropdown menu (same options as top menu) */
function PayTransferMenu({ className = "", buttonClassName = "" }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={buttonClassName}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Pay &amp; Transfer
        <span className="ml-2 text-xs">▾</span>
      </button>

      {open && (
        <div
          className="absolute left-0 bottom-full mb-2 w-72 rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden z-50"
          role="menu"
        >
          <button
            type="button"
            onClick={() => go("/pay-transfer/transfers")}
            className="w-full text-left px-4 py-3 hover:bg-slate-50"
            role="menuitem"
          >
            <div className="text-sm font-semibold text-slate-900">
              Account transfers
            </div>
            <div className="text-xs text-slate-500">
              Move money between your accounts
            </div>
          </button>

          {/* ✅ removed (demo) */}
          <button
            type="button"
            onClick={() => go("/pay-transfer/bills")}
            className="w-full text-left px-4 py-3 hover:bg-slate-50 border-t border-slate-100"
            role="menuitem"
          >
            <div className="text-sm font-semibold text-slate-900">
              Bill payments
            </div>
            <div className="text-xs text-slate-500">Pay a saved biller</div>
          </button>

          {/* ✅ removed (demo) */}
          <button
            type="button"
            onClick={() => go("/pay-transfer/etransfer")}
            className="w-full text-left px-4 py-3 hover:bg-slate-50 border-t border-slate-100"
            role="menuitem"
          >
            <div className="text-sm font-semibold text-slate-900">
              Interac e-Transfer
            </div>
            <div className="text-xs text-slate-500">Send money to someone</div>
          </button>

          <button
            type="button"
            onClick={() => go("/pay-transfer/wire")}
            className="w-full text-left px-4 py-3 hover:bg-slate-50 border-t border-slate-100"
            role="menuitem"
          >
            <div className="text-sm font-semibold text-slate-900">
              Wire transfer
            </div>
            <div className="text-xs text-slate-500">
              Transfer to another bank account
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);

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
    setLoadingAccounts(true);
    setErr("");
    try {
      const res = await api.get("/accounts");
      setAccounts(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load accounts");
      setAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    if (isAdmin) navigate("/admin", { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
  }, [accounts]);

  const displayName = user?.fullName || user?.name || "Customer";

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const goToAccountTransactions = (accountId) => {
    navigate(`/transactions?accountId=${accountId}`);
  };

  if (isAdmin) return null;

  return (
    <div className="space-y-5">
      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            {greeting}, {displayName}
          </h1>

          <div className="mt-3 bg-slate-50 rounded-xl px-4 py-3 inline-block">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Total Balance
            </p>

            <div className="flex items-center gap-3">
              <div className="text-4xl font-extrabold text-slate-900 mt-1">
                {showBalance ? formatMoney(totalBalance) : "••••••"}
              </div>

              <button
                type="button"
                onClick={() => setShowBalance((v) => !v)}
                className="mt-1 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
                aria-label={showBalance ? "Hide balance" : "Show balance"}
                title={showBalance ? "Hide balance" : "Show balance"}
              >
                {showBalance ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={fetchAccounts}
          className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex">
              <div className="w-1.5 bg-pb-600" />

              <div className="flex-1 p-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  Bank accounts
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Chequing and savings accounts.
                </p>

                <div className="mt-4 border-t border-slate-200" />

                {loadingAccounts ? (
                  <p className="mt-4 text-slate-600">Loading accounts...</p>
                ) : accounts.length === 0 ? (
                  <p className="mt-4 text-slate-600">No accounts found.</p>
                ) : (
                  <div className="divide-y mt-2">
                    {accounts.map((acc) => (
                      <button
                        key={acc._id}
                        onClick={() => goToAccountTransactions(acc._id)}
                        className="w-full text-left py-4 flex justify-between hover:bg-slate-50 px-2 rounded-lg"
                        title="View transaction history"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">
                            {(acc.type || "").toUpperCase()}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {acc.accountNumber}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-slate-500">Balance</div>
                          <div className="text-lg font-bold text-slate-900">
                            {showBalance ? formatMoney(acc.balance) : "••••••"}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* ✅ Bottom actions: Pay & Transfer now opens dropdown menu */}
                <div className="mt-5 flex gap-3">
                  <PayTransferMenu
                    buttonClassName="rounded-full bg-pb-600 text-white px-5 py-2 text-sm font-semibold hover:bg-pb-700"
                  />

                  <button
                    onClick={() => navigate("/transactions")}
                    className="rounded-full bg-white border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View History
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
          <p className="text-sm font-semibold text-slate-900">Quick links</p>

          <div className="mt-4 space-y-2">
            <button
              onClick={() => navigate("/pay-transfer/transfers")}
              className="w-full text-left rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50"
            >
              Account transfers
            </button>

            <button
              onClick={() => navigate("/pay-transfer/wire")}
              className="w-full text-left rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50"
            >
              Wire transfer
            </button>

            <button
              onClick={() => navigate("/pay-transfer/bills")}
              className="w-full text-left rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50"
            >
              Bill payments
            </button>

            <button
              onClick={() => navigate("/pay-transfer/etransfer")}
              className="w-full text-left rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50"
            >
              Interac e-Transfer
            </button>

            <button
              onClick={() => navigate("/transactions")}
              className="w-full text-left rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50"
            >
              View transactions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}