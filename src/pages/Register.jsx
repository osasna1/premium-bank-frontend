import { useNavigate } from "react-router-dom";

export default function RegisterOnlineBanking() {
  const navigate = useNavigate();

  const go = (type) => {
    navigate(`/register-online-banking/card?type=${type}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="h-14 bg-pb-600 flex items-center px-6">
        <div className="flex items-center gap-3 text-white">
          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
            PB
          </div>
          <span className="text-lg font-semibold tracking-wide">Premium Bank</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Left: Main */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <h1 className="text-4xl font-extrabold text-slate-900">
              Register for online banking
            </h1>

            <p className="text-slate-600 mt-4">
              Get started with online banking in a few quick steps:
            </p>

            <ul className="mt-6 space-y-3 text-slate-700">
              <li className="flex gap-3">
                <span className="font-bold">▢</span>
                <span>Enter your debit or credit card number</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">🔒</span>
                <span>Confirm your personal information and create a password</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">👍</span>
                <span>Get started with online and mobile banking</span>
              </li>
            </ul>

            <button
              onClick={() => go("debit")}
              className="mt-8 rounded-full bg-pb-600 text-white px-8 py-3 font-semibold hover:bg-pb-700"
            >
              CONTINUE
            </button>

            <p className="text-xs text-slate-500 mt-6">
              By continuing, you agree to our Electronic Banking Services Agreement.
            </p>
          </div>

          {/* Right: Cards */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900">
                Register a new card for online banking
              </h2>

              <div className="mt-4 space-y-2">
                <button
                  onClick={() => go("debit")}
                  className="w-full text-left font-semibold text-pb-700 hover:underline"
                >
                  DEBIT CARD
                </button>

                <div className="text-slate-400 text-sm">or</div>

                <button
                  onClick={() => go("credit")}
                  className="w-full text-left font-semibold text-pb-700 hover:underline"
                >
                  CREDIT CARD
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-start gap-3">
                <div className="text-lg">🔒</div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    Your security always comes first
                  </h3>
                  <p className="text-slate-600 mt-1">
                    We use advanced banking security technology to keep your money and
                    personal information safe.
                  </p>
                  <button className="mt-3 text-pb-700 font-semibold hover:underline">
                    Learn more about how we protect you →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Small helper link */}
        <div className="mt-6">
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-slate-600 hover:underline"
          >
            Back to Sign in
          </button>
        </div>
      </div>
    </div>
  );
}