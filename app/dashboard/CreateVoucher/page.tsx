"use client";
import { useState, ChangeEvent } from "react";
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
import { useRouter } from "next/navigation";

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
  const router = useRouter();
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
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Main Section */}
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="bg-blue-600 text-white rounded-2xl p-6 shadow mb-8">
            <h1 className="text-3xl font-semibold flex items-center gap-2">
              📊 Create Voucher
            </h1>
            <p className="text-blue-50 mt-2 text-base opacity-90">
              Add a new voucher entry to your Tally system.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl shadow border border-gray-200">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">
                Voucher Information
              </h2>
              <p className="text-gray-500 mt-1 text-sm">
                Fill in the details below to create a new voucher.
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Voucher Type */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <FileText className="w-4 h-4 text-gray-500" />
                    Voucher Type
                  </label>
                  <select
                    name="voucherType"
                    value={formData.voucherType}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    # Voucher Number
                  </label>
                  <input
                    type="text"
                    name="voucherNumber"
                    value={formData.voucherNumber}
                    onChange={handleChange}
                    placeholder="e.g., V001"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    Amount
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Party Name */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <User className="w-4 h-4 text-gray-500" />
                    Party Name
                  </label>
                  <input
                    type="text"
                    name="partyName"
                    value={formData.partyName}
                    onChange={handleChange}
                    placeholder="Customer/Supplier name"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Ledger Name */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    Ledger Name
                  </label>
                  <input
                    type="text"
                    name="ledgerName"
                    value={formData.ledgerName}
                    onChange={handleChange}
                    placeholder="e.g., Sales Account, Cash Account"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Narration */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Narration
                  </label>
                  <textarea
                    name="narration"
                    value={formData.narration}
                    onChange={handleChange}
                    placeholder="Description of the transaction..."
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
              </div>

              {/* Result Message */}
              {result && (
                <div
                  className={`mt-4 flex items-start gap-3 p-4 rounded-lg border ${
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
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
    </div>
  );
}
