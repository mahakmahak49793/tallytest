"use client";
import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  Calendar,
  User,
  DollarSign,
  BookOpen,
  Save,
} from "lucide-react";

interface FormData {
  voucherType: string;
  voucherNumber: string;
  date: string;
  partyName: string;
  amount: string;
  narration: string;
  ledgerName: string;
}

interface Result {
  type: "success" | "error";
  message: string;
}

export default function CreateVoucher() {
  const [formData, setFormData] = useState<FormData>({
    voucherType: "Sales",
    voucherNumber: "",
    date: new Date().toISOString().split("T")[0],
    partyName: "",
    amount: "",
    narration: "",
    ledgerName: "",
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<Result | null>(null);

  const handleSubmit = async (): Promise<void> => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/create-voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ type: "success", message: data.message });
        setFormData({
          voucherType: "Sales",
          voucherNumber: "",
          date: new Date().toISOString().split("T")[0],
          partyName: "",
          amount: "",
          narration: "",
          ledgerName: "",
        });
      } else {
        setResult({
          type: "error",
          message: data.error || "Failed to create voucher",
        });
      }
    } catch (error) {
      setResult({ type: "error", message: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      <div className="w-full p-8 mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-900">Create Voucher</h1>
          <p className="text-blue-600 mt-1">Add a new voucher entry to your Tally system</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-md border border-blue-100">
          <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-white">
            <h2 className="font-semibold text-blue-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Voucher Information
            </h2>
            <p className="text-blue-600 mt-1 text-sm">
              Fill in the details below to create a new voucher
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Voucher Type */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-blue-600 mb-2">
                  <FileText className="w-4 h-4" />
                  Voucher Type
                </label>
                <select
                  name="voucherType"
                  value={formData.voucherType}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-blue-200 px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                >
                  <option value="Sales">Sales</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Payment">Payment</option>
                  <option value="Receipt">Receipt</option>
                  <option value="Journal">Journal</option>
                  <option value="Contra">Contra</option>
                </select>
              </div>

              {/* Voucher Number */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-blue-600 mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  Voucher Number
                </label>
                <input
                  type="text"
                  name="voucherNumber"
                  value={formData.voucherNumber}
                  onChange={handleChange}
                  placeholder="e.g., V001"
                  className="w-full rounded-lg border border-blue-200 px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>

              {/* Date */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-blue-600 mb-2">
                  <Calendar className="w-4 h-4" />
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-blue-200 px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>

              {/* Amount */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-blue-600 mb-2">
                  <DollarSign className="w-4 h-4" />
                  Amount
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full rounded-lg border border-blue-200 px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>

              {/* Party Name */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-blue-600 mb-2">
                  <User className="w-4 h-4" />
                  Party Name
                </label>
                <input
                  type="text"
                  name="partyName"
                  value={formData.partyName}
                  onChange={handleChange}
                  placeholder="Customer/Supplier name"
                  className="w-full rounded-lg border border-blue-200 px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>

              {/* Ledger Name */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-blue-600 mb-2">
                  <BookOpen className="w-4 h-4" />
                  Ledger Name
                </label>
                <input
                  type="text"
                  name="ledgerName"
                  value={formData.ledgerName}
                  onChange={handleChange}
                  placeholder="e.g., Sales Account, Cash Account"
                  className="w-full rounded-lg border border-blue-200 px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>

              {/* Narration */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-blue-600 mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Narration
                </label>
                <textarea
                  name="narration"
                  value={formData.narration}
                  onChange={handleChange}
                  placeholder="Description of the transaction..."
                  rows={4}
                  className="w-full rounded-lg border border-blue-200 px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* Result Message */}
            {result && (
              <div
                className={`flex items-start gap-3 p-4 rounded-xl border ${
                  result.type === "success"
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                {result.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <p
                  className={`text-sm font-medium ${
                    result.type === "success"
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  {result.message}
                </p>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="p-6 border-t border-blue-100 bg-gradient-to-r from-blue-50 to-white flex justify-end gap-4">
            <button
              type="button"
              className="px-6 py-2.5 border border-blue-200 text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Create Voucher
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}