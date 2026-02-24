import React from "react";

export default function ConfirmModal({
  open,
  title = "Are you sure?",
  lines = [],
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[92%] max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>

          <div className="mt-4 space-y-2 text-gray-700">
            {lines.map((t, idx) => (
              <p key={idx} className="text-base">
                {t}
              </p>
            ))}
          </div>
        </div>

        <div className="flex gap-3 p-4 bg-gray-50">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold text-gray-800 hover:bg-gray-100 disabled:opacity-60"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}