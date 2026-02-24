import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function RegisterOnlineBankingCard() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const type = (params.get("type") || "debit").toLowerCase();
  const label = useMemo(() => (type === "credit" ? "Credit" : "Debit"), [type]);

  const [cardNumber, setCardNumber] = useState("");
  const [err, setErr] = useState("");

  const onContinue = (e) => {
    e.preventDefault();
    setErr("");

    const clean = cardNumber.replace(/\s+/g, "");
    if (!clean) return setErr("Enter your card number.");
    if (!/^\d{12,19}$/.test(clean)) {
      return setErr("Card number must be 12–19 digits.");
    }

    // ✅ Now go to Create Account page (your existing Register.jsx)
    // If later you want step 2 page instead, we can add it.
    navigate("/register");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="h-14 bg-pb-600 flex items-center px-6 justify-between">
        <div className="flex items-center gap-3 text-white">
          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
            PB
          </div>
          <span className="text-lg font-semibold tracking-wide">Premium Bank</span>
        </div>

        <button
          onClick={() => navigate("/register-online-banking")}
          className="text-white/90 hover:underline text-sm font-semibold"
        >
          Back
        </button>
      </div>

      <div className="flex justify-center items-center mt-16 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-slate-200">
          <h1 className="text-2xl font-bold mb-2">
            Register with your {label} card
          </h1>
          <p className="text-sm text-slate-600 mb-5">
            Enter your {label.toLowerCase()} card number to continue.
          </p>

          {err && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-4 text-sm">
              {err}
            </div>
          )}

          <form onSubmit={onContinue} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                {label} card number
              </label>
              <input
                className="mt-1 w-full border rounded-xl p-3"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="Enter card number"
                inputMode="numeric"
              />
              <p className="text-xs text-slate-500 mt-2">
                Digits only (12–19). Example: 5123 4567 8901 2345
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-pb-600 text-white rounded-full py-3 font-semibold hover:bg-pb-700"
            >
              CONTINUE
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}