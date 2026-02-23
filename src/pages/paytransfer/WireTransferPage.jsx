import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";

export default function WireTransferPage() {
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const [step, setStep] = useState("form");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [otp, setOtp] = useState("");

  // ✅ store request id if backend returns it (otpId/requestId)
  const [otpRequestId, setOtpRequestId] = useState("");

  const [form, setForm] = useState({
    fromAccountId: "",
    amount: "",
    beneficiaryName: "",
    bankName: "",
    bankAccountNumber: "",
    description: "Wire transfer",
  });

  const formatMoney = (value) => {
    const n = Number(value || 0);
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(n);
  };

  // Load accounts
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

  const selectedFrom = useMemo(
    () => accounts.find((a) => a._id === form.fromAccountId),
    [accounts, form.fromAccountId]
  );

  const requestOtp = async () => {
    setErr("");
    setMsg("");

    const amountNum = Number(form.amount);

    if (!form.fromAccountId) return setErr("Select account.");
    if (!form.amount || Number.isNaN(amountNum) || amountNum <= 0)
      return setErr("Enter valid amount.");
    if (!form.beneficiaryName.trim()) return setErr("Enter beneficiary name.");
    if (!form.bankName.trim()) return setErr("Enter bank name.");
    if (!form.bankAccountNumber.trim())
      return setErr("Enter bank account number.");

    try {
      setLoading(true);

      // ✅ Ensure backend gets clean payload + amount is a number
      const payload = {
        fromAccountId: form.fromAccountId,
        amount: amountNum,
        beneficiaryName: form.beneficiaryName.trim(),
        bankName: form.bankName.trim(),
        bankAccountNumber: form.bankAccountNumber.trim(),
        description: (form.description || "Wire transfer").trim(),
      };

      // Debug (helps you confirm correct endpoint)
      console.log("API baseURL:", api.defaults.baseURL);
      console.log("Requesting OTP:", payload);

      const res = await api.post("/transactions/wire/request-otp", payload);

      // ✅ save id if backend returns it
      const id =
        res?.data?.otpId ||
        res?.data?.requestId ||
        res?.data?.id ||
        "";
      setOtpRequestId(id);

      setStep("otp");
      setMsg("OTP sent. Enter the approval code to complete transfer.");
    } catch (e) {
      console.log("OTP request error:", e?.response?.status, e?.response?.data);
      setErr(e?.response?.data?.message || "Failed to request OTP.");
    } finally {
      setLoading(false);
    }
  };

  const confirmWire = async () => {
    setErr("");
    setMsg("");

    if (!otp.trim()) return setErr("Enter approval code (OTP).");

    try {
      setLoading(true);

      // ✅ Some backends need otp + requestId, some need otp only.
      // We send both safely.
      const body = {
        otp: otp.trim(),
        requestId: otpRequestId || undefined,
        otpId: otpRequestId || undefined,
      };

      console.log("Confirming wire transfer:", body);

      await api.post("/transactions/wire/confirm", body);

      setMsg("Wire transfer successful ✅ Redirecting...");
      setOtp("");
      setOtpRequestId("");

      setForm({
        fromAccountId: "",
        amount: "",
        beneficiaryName: "",
        bankName: "",
        bankAccountNumber: "",
        description: "Wire transfer",
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);
    } catch (e) {
      console.log("Confirm error:", e?.response?.status, e?.response?.data);
      setErr(e?.response?.data?.message || "Transfer failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        ← Back
      </button>

      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Wire Transfer</h2>
            <p className="text-sm text-slate-500 mt-1">
              Transfer money to another bank account. Admin OTP approval required.
            </p>
          </div>

          {step === "otp" && (
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setOtp("");
                setOtpRequestId("");
                setErr("");
                setMsg("");
              }}
              className="text-sm font-semibold text-slate-600 hover:underline"
              disabled={loading}
              title="Go back to form"
            >
              Cancel
            </button>
          )}
        </div>

        {msg && (
          <div className="mt-4 mb-3 p-3 bg-green-50 text-green-700 rounded">
            {msg}
          </div>
        )}

        {err && (
          <div className="mt-4 mb-3 p-3 bg-red-50 text-red-700 rounded">
            {err}
          </div>
        )}

        {step === "form" ? (
          <>
            <select
              className="w-full border p-2 mb-3 rounded"
              value={form.fromAccountId}
              onChange={(e) =>
                setForm({ ...form, fromAccountId: e.target.value })
              }
              disabled={loadingAccounts || loading}
            >
              <option value="">Select account</option>
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.type} • {a.accountNumber} • {formatMoney(a.balance)}
                </option>
              ))}
            </select>

            {selectedFrom && (
              <div className="text-xs text-slate-500 mb-3">
                From: {selectedFrom.accountNumber}
              </div>
            )}

            <input
              placeholder="Amount"
              className="w-full border p-2 mb-3 rounded"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              disabled={loading}
              inputMode="decimal"
            />

            <input
              placeholder="Beneficiary Name"
              className="w-full border p-2 mb-3 rounded"
              value={form.beneficiaryName}
              onChange={(e) =>
                setForm({ ...form, beneficiaryName: e.target.value })
              }
              disabled={loading}
            />

            <input
              placeholder="Bank Name"
              className="w-full border p-2 mb-3 rounded"
              value={form.bankName}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              disabled={loading}
            />

            <input
              placeholder="Account Number"
              className="w-full border p-2 mb-4 rounded"
              value={form.bankAccountNumber}
              onChange={(e) =>
                setForm({ ...form, bankAccountNumber: e.target.value })
              }
              disabled={loading}
            />

            <button
              type="button"
              onClick={requestOtp}
              disabled={loading || loadingAccounts}
              className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Processing..." : "Transfer"}
            </button>
          </>
        ) : (
          <>
            <input
              placeholder="Enter approval code (OTP)"
              className="w-full border p-2 mb-4 rounded"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={loading}
              inputMode="numeric"
            />

            <button
              type="button"
              onClick={confirmWire}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Confirming..." : "Confirm Transfer"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}