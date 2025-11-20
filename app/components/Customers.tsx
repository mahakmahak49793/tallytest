/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState, FormEvent, ChangeEvent } from "react";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
interface Customer {
  name: string;
  mailingName?: string;
  address?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  gstin?: string;
  openingBalance?: number; // stored as signed number: positive = Cr, negative = Dr
}

interface Message {
  type: "success" | "error";
  text: string;
}

// ──────────────────────────────────────────────────────────────
// Safe value display helper
// ──────────────────────────────────────────────────────────────
function safeValue(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object" && value !== null) {
    return (value as any)._ ?? JSON.stringify(value);
  }
  return String(value);
}

// ──────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────
export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    mailingName: "",
    address: "",
    phone: "",
    mobile: "",
    email: "",
    gstin: "",
    openingBalance: "",
    openingBalanceType: "Credit" as "Credit" | "Debit",
  });

  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState<Message | null>(null);

  // Load customers on mount
  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error("Failed to load customers:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomerDetails(name: string) {
    setSelected(name);
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${encodeURIComponent(name)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setDetails(data.customer ?? null);
    } catch (error) {
      console.error("Failed to load customer details:", error);
      setDetails(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCustomer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreateLoading(true);
    setCreateMessage(null);

    const balanceValue = formData.openingBalance ? parseFloat(formData.openingBalance) || 0 : 0;
    const signedBalance = formData.openingBalanceType === "Credit" ? balanceValue : -balanceValue;

    const payload = {
      ...formData,
      openingBalance: signedBalance,
    };

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setCreateMessage({ type: "success", text: data.message || "Customer created successfully!" });

        setFormData({
          name: "",
          mailingName: "",
          address: "",
          phone: "",
          mobile: "",
          email: "",
          gstin: "",
          openingBalance: "",
          openingBalanceType: "Credit",
        });

        setTimeout(() => {
          loadCustomers();
          setShowCreateForm(false);
          setCreateMessage(null);
        }, 2000);
      } else {
        setCreateMessage({ type: "error", text: data.error || "Failed to create customer" });
      }
    } catch (error) {
      setCreateMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setCreateLoading(false);
    }
  }

  function handleInputChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Customer Management</h1>
            <p className="text-blue-600 mt-1">View and manage customer information</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          >
            {showCreateForm ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Customer
              </>
            )}
          </button>
        </div>

        {/* Create Customer Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 mb-6">
            <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              Create New Customer
            </h2>

            {createMessage && (
              <div
                className={`mb-4 p-4 rounded-lg border ${
                  createMessage.type === "success"
                    ? "bg-green-100 text-green-800 border-green-300"
                    : "bg-red-100 text-red-800 border-red-300"
                }`}
              >
                {createMessage.text}
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter customer name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">Mailing Name</label>
                  <input
                    type="text"
                    name="mailingName"
                    value={formData.mailingName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter mailing name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="customer@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">Mobile</label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter mobile number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">GSTIN</label>
                  <input
                    type="text"
                    name="gstin"
                    value={formData.gstin}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter GSTIN"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-blue-900 mb-1">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter complete address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">Opening Balance</label>
                  <input
                    type="number"
                    name="openingBalance"
                    value={formData.openingBalance}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">Balance Type</label>
                  <select
                    name="openingBalanceType"
                    value={formData.openingBalanceType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Credit">Credit (Cr)</option>
                    <option value="Debit">Debit (Dr)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={createLoading || !formData.name.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {createLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Create Customer
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setCreateMessage(null);
                  }}
                  className="px-6 py-3 border border-blue-300 text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer List */}
          <div className="bg-white rounded-xl shadow-md border border-blue-100">
            <div className="p-5 border-b border-blue-100 bg-linear-to-r from-blue-50 to-white">
              <h2 className="font-semibold text-blue-900 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Customers ({customers.length})
              </h2>
            </div>
            <div className="h-[calc(100vh-240px)] overflow-auto">
              {loading && customers.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent"></div>
                </div>
              ) : (
                <ul className="p-3 space-y-2">
                  {customers.map((c) => (
                    <li key={c.name}>
                      <button
                        onClick={() => loadCustomerDetails(c.name)}
                        className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                          selected === c.name
                            ? "bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-lg transform scale-[1.02]"
                            : "bg-white hover:bg-blue-50 border border-blue-100 hover:border-blue-300 text-slate-700 hover:shadow-md"
                        }`}
                      >
                        <div className={`font-semibold ${selected === c.name ? "text-white" : "text-blue-900"}`}>
                          {safeValue(c.name)}
                        </div>
                        {c.email && (
                          <div className={`text-sm truncate mt-1 ${selected === c.name ? "text-blue-100" : "text-slate-500"}`}>
                            {safeValue(c.email)}
                          </div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Customer Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md border border-blue-100 h-full">
              <div className="p-5 border-b border-blue-100 bg-linear-to-br from-blue-50 to-white">
                <h2 className="font-semibold text-blue-900 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Customer Details
                </h2>
              </div>

              <div className="p-6 h-[calc(100vh-240px)] overflow-auto">
                {!details && !loading && (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <p className="text-slate-500 text-lg">Select a customer to view details</p>
                  </div>
                )}

                {loading && (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                  </div>
                )}

                {details && !loading && (
                  <div className="space-y-5">
                    <div className="bg-linear-to-br from-blue-600 to-blue-700 p-6 rounded-xl text-white shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                          {safeValue(details.name).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">{safeValue(details.name)}</h2>
                          <p className="text-blue-100 mt-1">{safeValue(details.mailingName)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-blue-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-blue-600 font-medium">Email</div>
                            <div className="text-sm text-slate-900 font-medium truncate">
                              {safeValue(details.email) || "—"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-blue-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-blue-600 font-medium">Phone</div>
                            <div className="text-sm text-slate-900 font-medium">
                              {safeValue(details.phone) || "—"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-blue-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-blue-600 font-medium">Mobile</div>
                            <div className="text-sm text-slate-900 font-medium">
                              {safeValue(details.mobile) || "—"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-blue-100">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-blue-600 font-medium mb-2">Address</div>
                          <div className="text-slate-900 leading-relaxed">
                            {safeValue(details.address) || "—"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-5 rounded-xl border border-blue-100">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-blue-600 font-medium mb-2">GSTIN</div>
                            <div className="text-slate-900 font-mono font-semibold text-lg">
                              {safeValue(details.gstin) || "—"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-xl border border-blue-100">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-blue-600 font-medium mb-2">Opening Balance</div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-slate-900 font-semibold text-lg">
                                ₹{Math.abs(details.openingBalance ?? 0).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                              {details.openingBalance !== undefined && details.openingBalance !== 0 && (
                                <span
                                  className={`text-sm font-bold px-2 py-0.5 rounded ${
                                    details.openingBalance < 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {details.openingBalance < 0 ? "Dr" : "Cr"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}