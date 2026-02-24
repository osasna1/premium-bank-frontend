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
            {/* ✅ Changed font-extrabold → font-semibold ONLY */}
            <h3 className="text-2xl font-semibold text-slate-900">
              {title}
            </h3>
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

  const [step, setStep] = useState("form");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [otp, setOtp] = useState("");
  const [otpRequestId, setOtpRequestId] = useState("");

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [pendingConfirmBody, setPendingConfirmBody] = useState(null);

  const [showBankNotice, setShowBankNotice] = useState(false);
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

  const validateFormOrSetError = () => {
    setErr("");
    setMsg("");

    if (!form.fromAccountId) return setErr("Select account."), false;

    const routingClean = String(form.routingNumber || "").replace(/[\s-]/g, "");
    if (!routingClean) return setErr("Enter routing number."), false;
    if (!/^\d+$/.test(routingClean))
      return setErr("Routing number must be digits only."), false;
    if (routingClean.length < 5 || routingClean.length > 12)
      return setErr("Routing number must be 5 to 12 digits."), false;

    if (!form.amount || Number.isNaN(amountNum) || amountNum <= 0)
      return setErr("Enter valid amount."), false;

    if (!form.beneficiaryName.trim())
      return setErr("Enter beneficiary name."), false;

    if (!form.bankName.trim())
      return setErr("Enter bank name."), false;

    if (!form.bankAccountNumber.trim())
      return setErr("Enter bank account number."), false;

    return true;
  };

  const onClickTransfer = () => {
    if (!validateFormOrSetError()) return;
    setShowBankNotice(true);
  };

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

  const openConfirmModal = () => {
    if (!otp.trim()) return setErr("Enter approval code (OTP).");

    setPendingConfirmBody({
      otp: otp.trim(),
      requestId: otpRequestId || undefined,
      otpId: otpRequestId || undefined,
    });

    setShowConfirm(true);
  };

  const confirmWireNow = async () => {
    try {
      setConfirmLoading(true);
      await api.post("/transactions/wire/confirm", pendingConfirmBody);

      setShowConfirm(false);
      setShowSuccess(true);

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
        onClick={() => navigate(-1)}
        className="mb-4 rounded-lg border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        ← Back
      </button>

      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Wire Transfer</h2>

        {msg && <div className="mt-4 bg-green-50 p-3 text-green-700 rounded">{msg}</div>}
        {err && <div className="mt-4 bg-red-50 p-3 text-red-700 rounded">{err}</div>}

        {step === "form" ? (
          <>
            <select
              className="w-full border p-2 mb-3 rounded"
              value={form.fromAccountId}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, fromAccountId: e.target.value }))
              }
            >
              <option value="">Select account</option>
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>
                  {(String(a.type || "").toLowerCase() === "chequing"
                    ? "checking"
                    : a.type)}{" "}
                  • {a.accountNumber} • {formatMoney(a.balance)}
                </option>
              ))}
            </select>

            <input
              placeholder="Routing Number"
              className="w-full border p-2 mb-3 rounded"
              value={form.routingNumber}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, routingNumber: e.target.value }))
              }
            />

            <input
              placeholder="Amount"
              className="w-full border p-2 mb-3 rounded"
              value={form.amount}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, amount: e.target.value }))
              }
            />

            <input
              placeholder="Beneficiary Name"
              className="w-full border p-2 mb-3 rounded"
              value={form.beneficiaryName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, beneficiaryName: e.target.value }))
              }
            />

            <input
              placeholder="Bank Name"
              className="w-full border p-2 mb-3 rounded"
              value={form.bankName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, bankName: e.target.value }))
              }
            />

            <input
              placeholder="Account Number"
              className="w-full border p-2 mb-4 rounded"
              value={form.bankAccountNumber}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  bankAccountNumber: e.target.value,
                }))
              }
            />

            <button
              onClick={onClickTransfer}
              className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700"
            >
              Transfer
            </button>
          </>
        ) : (
          <>
            <input
              placeholder="Enter approval code (OTP)"
              className="w-full border p-2 mb-4 rounded"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <button
              onClick={openConfirmModal}
              className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700"
            >
              Continue
            </button>
          </>
        )}
      </div>

      <SimpleOkModal
        open={showBankNotice}
        title="Contact your bank"
        message="Contact your bank to request for OTP code."
        onOk={sendOtpToAdmin}
      />

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
        onCancel={() => setShowConfirm(false)}
        onConfirm={confirmWireNow}
      />

      <SimpleOkModal
        open={showSuccess}
        title="Transfer successful ✅"
        message=""
        onOk={onSuccessOk}
      />
    </div>
  );
}