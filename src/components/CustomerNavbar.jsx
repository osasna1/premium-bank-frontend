import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

export default function CustomerNavbar() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const [open, setOpen] = useState(false);
  const ddRef = useRef(null);

  // close dropdown when clicking outside
  useEffect(() => {
    const onDown = (e) => {
      if (!ddRef.current) return;
      if (!ddRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const itemClass =
    "block w-full text-left px-4 py-2 text-sm hover:bg-slate-50";

  const activeClass = ({ isActive }) =>
    isActive
      ? "text-white font-semibold"
      : "text-white/90 hover:text-white";

  return (
    <div className="bg-pb-600">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-5">
          <Link to="/dashboard" className="flex items-center gap-3 text-white">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
              PB
            </div>
            <div className="font-semibold tracking-wide">Premium Bank</div>
          </Link>

          <nav className="hidden sm:flex items-center gap-6">
            <NavLink to="/dashboard" className={activeClass}>
              Accounts
            </NavLink>

            {/* ✅ Pay & Transfer dropdown */}
            <div className="relative" ref={ddRef}>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="text-white/90 hover:text-white font-semibold flex items-center gap-2"
              >
                Pay & Transfer
                <span className="text-xs">{open ? "▲" : "▼"}</span>
              </button>

              {open && (
                <div className="absolute left-0 mt-3 w-64 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden z-50">
                  <button
                    className={itemClass}
                    onClick={() => {
                      setOpen(false);
                      navigate("/pay-transfer/transfers");
                    }}
                  >
                    <div className="font-semibold text-slate-900">
                      Account transfers
                    </div>
                    <div className="text-xs text-slate-500">
                      Move money between your accounts
                    </div>
                  </button>

                  <button
                    className={itemClass}
                    onClick={() => {
                      setOpen(false);
                      navigate("/pay-transfer/bills");
                    }}
                  >
                    <div className="font-semibold text-slate-900">
                      Bill payments
                    </div>
                    <div className="text-xs text-slate-500">
                      Pay a saved biller
                    </div>
                  </button>

                  <button
                    className={itemClass}
                    onClick={() => {
                      setOpen(false);
                      navigate("/pay-transfer/etransfer");
                    }}
                  >
                    <div className="font-semibold text-slate-900">
                      Interac e-Transfer
                    </div>
                    <div className="text-xs text-slate-500">
                      Send money to someone
                    </div>
                  </button>

                  {/* ✅ Wire Transfer */}
                  <button
                    className={itemClass}
                    onClick={() => {
                      setOpen(false);
                      navigate("/pay-transfer/wire");
                    }}
                  >
                    <div className="font-semibold text-slate-900">
                      Wire transfer
                    </div>
                    <div className="text-xs text-slate-500">
                      Transfer to another bank account
                    </div>
                  </button>
                </div>
              )}
            </div>

            <NavLink to="/transactions" className={activeClass}>
              Transactions
            </NavLink>
          </nav>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <span className="hidden md:block text-white/90 text-sm">
            {user?.email || ""}
          </span>
          <button
            onClick={logout}
            className="rounded-full bg-white/15 hover:bg-white/20 px-4 py-2 text-sm font-semibold text-white"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}