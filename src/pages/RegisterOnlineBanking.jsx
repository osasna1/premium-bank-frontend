import { useNavigate } from "react-router-dom";

export default function RegisterOnlineBanking() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* SINGLE COLUMN CLEAN LAYOUT */}
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900">
            Register for online banking
          </h1>

          <p className="mt-4 text-slate-600">
            Get started with online banking in a few quick steps:
          </p>

          <div className="mt-6 space-y-4">
            <div className="flex gap-3">
              <div className="mt-1 h-7 w-7 rounded-lg border border-slate-200 flex items-center justify-center">
                💳
              </div>
              <div className="font-semibold text-slate-900">
                Enter your debit or credit card number
              </div>
            </div>

            <div className="flex gap-3">
              <div className="mt-1 h-7 w-7 rounded-lg border border-slate-200 flex items-center justify-center">
                🔒
              </div>
              <div className="font-semibold text-slate-900">
                Confirm your details and create a password
              </div>
            </div>

            <div className="flex gap-3">
              <div className="mt-1 h-7 w-7 rounded-lg border border-slate-200 flex items-center justify-center">
                👍
              </div>
              <div className="font-semibold text-slate-900">
                Get started with online and mobile banking
              </div>
            </div>
          </div>

          <p className="mt-6 text-sm text-slate-600">
            By continuing, you agree to our{" "}
            <span className="text-blue-700 font-semibold underline cursor-pointer">
              Electronic Banking Services Agreement
            </span>.
          </p>

          <button
            onClick={() => navigate("/register-card")}
            className="mt-8 rounded-full bg-pb-600 text-white px-10 py-3 font-semibold hover:bg-pb-700"
          >
            Continue
          </button>

          <button
            onClick={() => navigate("/login")}
            className="mt-4 block text-sm font-semibold text-slate-600 hover:underline"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}