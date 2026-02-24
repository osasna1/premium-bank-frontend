import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import ConfirmModal from "../../components/ConfirmModal";

function SimpleOkModal({ open, title, message, okText = "OK", onOk, loading }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-extrabold text-slate-900">{title}</h3>
          </div>

          {message ? (
            <p className="mt-4 text-slate-600">{message}</p>
          ) : null}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onOk}
              disabled={!!loading}
              className="rounded-xl bg-blue-600 text-white px-8 py-3 font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Please wait..." : okText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WireTransferPage() {
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const [step, setStep] = useState("form"); // form | otp
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [otp, setOtp] = useState("");

  const [otpRequestId, setOtpRequestId] = useState("");

  // Confirmation modal state (Yes, transfer)
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [pendingConfirmBody, setPendingConfirmBody] = useState(null);

  // ✅ NEW: “Contact your bank…” popup BEFORE sending OTP
  const [showBankNotice, setShowBankNotice] = useState(false);

  // ✅ NEW: Success popup (OK only)
  const [showSuccess, setShowSuccess] = useState(false);

  const [form, setForm] = useState({
    fromAccountId: "",
    routingNumber: "",
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

  const amountNum = Number(form.amount || 0);
  const feesNum = 0;
  const totalNum = amountNum + feesNum;

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

  // ✅ validation used before showing “Contact your bank…” popup
  const validateFormOrSetError = () => {
    setErr("");
    setMsg("");

    if (!form.fromAccountId) {
      setErr("Select account.");
      return false;
    }

    const routingClean = String(form.routingNumber || "").replace(/[\s-]/g, "");
    if (!routingClean) {
      setErr("Enter routing number.");
      return false;
    }
    if (!/^\d+$/.test(routingClean)) {
      setErr("Routing number must be digits only.");
      return false;
    }
    if (routingClean.length < 5 || routingClean.length > 12) {
      setErr("Routing number must be 5 to 12 digits.");
      return false;
    }

    if (!form.amount || Number.isNaN(amountNum) || amountNum <= 0) {
      setErr("Enter valid amount.");
      return false;
    }

    if (!form.beneficiaryName.trim()) {
      setErr("Enter beneficiary name.");
      return false;
    }

    if (!form.bankName.trim()) {
      setErr("Enter bank name.");
      return false;
    }

    if (!form.bankAccountNumber.trim()) {
      setErr("Enter bank account number.");
      return false;
    }

    return true;
  };

  // ✅ Step 1: click Transfer -> show notice popup first (NO OTP yet)
  const onClickTransfer = () => {
    const ok = validateFormOrSetError();
    if (!ok) return;
    setShowBankNotice(true);
  };

  // ✅ Step 2: user clicks OK on notice -> NOW send OTP to admin
  const sendOtpToAdmin = async () => {
    setErr("");
    setMsg("");

    const routingClean = String(form.routingNumber || "").replace(/[\s-]/g, "");

    try {
      setLoading(true);

      const payload = {
        fromAccountId: form.fromAccountId,
        routingNumber: routingClean,
        amount: amountNum,
        beneficiaryName: form.beneficiaryName.trim(),
        bankName: form.bankName.trim(),
        bankAccountNumber: form.bankAccountNumber.trim(),
        description: (form.description || "Wire transfer").trim(),
      };

      const res = await api.post("/transactions/wire/request-otp", payload);

      const id = res?.data?.otpId || res?.data?.requestId || res?.data?.id || "";
      setOtpRequestId(id);

      setShowBankNotice(false);
      setStep("otp");
      setMsg("OTP sent. Enter the approval code to continue.");
    } catch (e) {
      setShowBankNotice(false);
      setErr(e?.response?.data?.message || "Failed to request OTP.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Step 3: user enters OTP -> open confirm modal (Yes, transfer)
  const openConfirmModal = () => {
    setErr("");
    setMsg("");

    if (!otp.trim()) return setErr("Enter approval code (OTP).");

    const body = {
      otp: otp.trim(),
      requestId: otpRequestId || undefined,
      otpId: otpRequestId || undefined,
    };

    setPendingConfirmBody(body);
    setShowConfirm(true);
  };

  // ✅ Step 4: user clicks Yes, transfer -> process -> show success popup (OK only)
  const confirmWireNow = async () => {
    setErr("");
    setMsg("");

    if (!pendingConfirmBody) {
      setShowConfirm(false);
      return;
    }

    try {
      setConfirmLoading(true);

      await api.post("/transactions/wire/confirm", pendingConfirmBody);

      setShowConfirm(false);
      setShowSuccess(true); // ✅ success modal (no auto redirect)

      // cleanup otp state now (but do NOT redirect yet)
      setOtp("");
      setOtpRequestId("");
      setPendingConfirmBody(null);
    } catch (e) {
      setErr(e?.response?.data?.message || "Transfer failed.");
      setShowConfirm(false);
    } finally {
      setConfirmLoading(false);
    }
  };

  // ✅ after customer clicks OK on success -> reset + go dashboard
  const onSuccessOk = () => {
    setShowSuccess(false);

    setForm({
      fromAccountId: "",
      routingNumber: "",
      amount: "",
      beneficiaryName: "",
      bankName: "",
      bankAccountNumber: "",
      description: "Wire transfer",
    });

    setStep("form");
    setMsg("");
    setErr("");
    navigate("/dashboard");
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
                setPendingConfirmBody(null);
                setShowConfirm(false);
                setShowBankNotice(false);
                setShowSuccess(false);
                setErr("");
                setMsg("");
              }}
              className="text-sm font-semibold text-slate-600 hover:underline"
              disabled={loading || confirmLoading}
              title="Go back to form"
            >
              Cancel
            </button>
          )}
        </div>

        {msg && (
          <div className="mt-4 mb-3 p-3 bg-green-50 text-green-700 rounded">{msg}</div>
        )}
        {err && (
          <div className="mt-4 mb-3 p-3 bg-red-50 text-red-700 rounded">{err}</div>
        )}

        {step === "form" ? (
          <>
            <select
              className="w-full border p-2 mb-3 rounded"
              value={form.fromAccountId}
              onChange={(e) => setForm((prev) => ({ ...prev, fromAccountId: e.target.value }))}
              disabled={loadingAccounts || loading}
            >
              <option value="">Select account</option>
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>
                  {/* ✅ change chequing -> checking only in display */}
                  {(String(a.type || "").toLowerCase() === "chequing" ? "checking" : a.type)} •{" "}
                  {a.accountNumber} • {formatMoney(a.balance)}
                </option>
              ))}
            </select>

            {selectedFrom && (
              <div className="text-xs text-slate-500 mb-3">From: {selectedFrom.accountNumber}</div>
            )}

            <input
              placeholder="Routing Number"
              className="w-full border p-2 mb-3 rounded"
              value={form.routingNumber || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, routingNumber: e.target.value }))}
              disabled={loading}
              inputMode="numeric"
            />
            <p className="text-xs text-slate-500 -mt-2 mb-3">
              Digits only (5–12). Example: 123456789
            </p>

            <input
              placeholder="Amount"
              className="w-full border p-2 mb-3 rounded"
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              disabled={loading}
              inputMode="decimal"
            />

            <input
              placeholder="Beneficiary Name"
              className="w-full border p-2 mb-3 rounded"
              value={form.beneficiaryName}
              onChange={(e) => setForm((prev) => ({ ...prev, beneficiaryName: e.target.value }))}
              disabled={loading}
            />

            <input
              placeholder="Bank Name"
              className="w-full border p-2 mb-3 rounded"
              value={form.bankName}
              onChange={(e) => setForm((prev) => ({ ...prev, bankName: e.target.value }))}
              disabled={loading}
            />

            <input
              placeholder="Account Number"
              className="w-full border p-2 mb-4 rounded"
              value={form.bankAccountNumber}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, bankAccountNumber: e.target.value }))
              }
              disabled={loading}
            />

            <button
              type="button"
              onClick={onClickTransfer}
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
              disabled={loading || confirmLoading}
              inputMode="numeric"
            />

            <button
              type="button"
              onClick={openConfirmModal}
              disabled={loading || confirmLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 disabled:opacity-60"
            >
              {loading || confirmLoading ? "Processing..." : "Continue"}
            </button>
          </>
        )}
      </div>

      {/* ✅ Step Popup: contact bank first */}
      <SimpleOkModal
        open={showBankNotice}
        title="Contact your bank"
        message="Contact your bank to request for OTP code."
        okText="OK"
        loading={loading}
        onOk={sendOtpToAdmin}
      />

      {/* ✅ Confirm transfer (your existing modal) */}
      <ConfirmModal
        open={showConfirm}
        title="Are you sure you want to transfer?"
        lines={[
          `Transaction Amount: ${formatMoney(amountNum)}`,
          `Total Fees: ${formatMoney(feesNum)}`,
          `Total Amount: ${formatMoney(totalNum)}`,
          `Beneficiary: ${form.beneficiaryName || "-"}`,
          `Bank: ${form.bankName || "-"}`,
          `Routing: ${form.routingNumber || "-"}`,
        ]}
        confirmText="Yes, transfer"
        cancelText="Cancel"
        loading={confirmLoading}
        onCancel={() => {
          setShowConfirm(false);
          setPendingConfirmBody(null);
        }}
        onConfirm={confirmWireNow}
      />

      {/* ✅ Success popup: ONE “Transfer successful” + OK only */}
      <SimpleOkModal
        open={showSuccess}
        title="Transfer successful ✅"
        message=""
        okText="OK"
        onOk={onSuccessOk}
      />
    </div>
  );
}