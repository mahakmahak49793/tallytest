/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState, FormEvent, ChangeEvent } from "react";

interface Customer {
  name: string;
  mailingName?: string;
  address?: string;
  phone?: string | { _: string; $?: { TYPE: string } };
  mobile?: string | { _: string; $?: { TYPE: string } };
  email?: string;
  gstin?: string |{ _: string; $?: { TYPE: string } };
  openingBalance?: number;
}

interface Message {
  type: "success" | "error";
  text: string;
}

function safeValue(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  if (Array.isArray(value)) return value.map(item => safeValue(item)).join(", ");
  
  if (typeof value === "object" && value !== null) {
    // Extract value from _ property
    if ((value as any)._ !== undefined) {
      return String((value as any)._);
    }
    
    // Extract from common XML structures
    const paths = [
      'MOBILENUMBER', 'PHONENUMBER', 'GSTIN', 'ADDRESS', 'MAILINGNAME', 'EMAIL',
      'NAME', '$.NAME', 'PHONENUMBER.LIST.PHONENUMBER', 'MOBILENUMBER.LIST.MOBILENUMBER',
      'CONTACT.LIST.MOBILENUMBER', 'GSTDETAILS.LIST.GSTIN'
    ];
    
    for (const path of paths) {
      const keys = path.split('.');
      let current: any = value;
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          current = null;
          break;
        }
      }
      if (current && typeof current !== 'object') {
        return String(current);
      }
    }
    
    // Try to find any string value in the object
    for (const key in value as any) {
      const val = (value as any)[key];
      if (typeof val === 'string') {
        return val;
      }
      if (typeof val === 'number') {
        return val.toString();
      }
    }
    
    return "";
  }
  
  return String(value);
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
  const [editLoading, setEditLoading] = useState(false);
  const [editMessage, setEditMessage] = useState<Message | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
    setShowEditForm(false);
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

  async function handleUpdateCustomer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;

    setEditLoading(true);
    setEditMessage(null);

    const balanceValue = formData.openingBalance ? parseFloat(formData.openingBalance) || 0 : 0;
    const signedBalance = formData.openingBalanceType === "Credit" ? balanceValue : -balanceValue;

    const payload: any = {};
  
  if (formData.mailingName.trim()) payload.mailingName = formData.mailingName.trim();
  if (formData.address.trim()) payload.address = formData.address.trim();
  if (formData.phone.trim()) payload.phone = formData.phone.trim();
  if (formData.mobile.trim()) payload.mobile = formData.mobile.trim();
  if (formData.email.trim()) payload.email = formData.email.trim();
  if (formData.gstin.trim()) payload.gstin = formData.gstin.trim();
  if (balanceValue !== 0) payload.openingBalance = signedBalance;

  try {
    const res = await fetch(`/api/customers/${encodeURIComponent(selected)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

      const data = await res.json();

      if (res.ok) {
        setEditMessage({ type: "success", text: data.message || "Customer updated successfully!" });

        setTimeout(() => {
          loadCustomers();
          loadCustomerDetails(selected);
          setShowEditForm(false);
          setEditMessage(null);
        }, 2000);
      } else {
        setEditMessage({ type: "error", text: data.error || "Failed to update customer" });
      }
    } catch (error) {
      setEditMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDeleteCustomer() {
    if (!selected) return;

    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/customers/${encodeURIComponent(selected)}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        setShowDeleteConfirm(false);
        setSelected(null);
        setDetails(null);
        loadCustomers();
      } else {
        alert(data.error || "Failed to delete customer");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  }

 function startEdit() {
  if (!details) return;
  
  const balance = details.openingBalance ?? 0;
  const absBalance = Math.abs(balance);
  const balanceType = balance < 0 ? "Debit" : "Credit";

  // Extract values from nested objects if they exist
  const phone = typeof details.phone === 'object' && details.phone !== null ? details.phone._ : details.phone;
  const mobile = typeof details.mobile === 'object' && details.mobile !== null ? details.mobile._ : details.mobile;
  const gstin = typeof details.gstin === 'object' && details.gstin !== null ? details.gstin._ : details.gstin;

  setFormData({
    name: details.name,
    mailingName: details.mailingName || "",
    address: details.address || "",
    phone: phone || "",
    mobile: mobile || "",
    email: details.email || "",
    gstin: gstin || "",
    openingBalance: absBalance > 0 ? absBalance.toString() : "",
    openingBalanceType: balanceType,
  });
  setShowEditForm(true);
  setEditMessage(null);
}

  function handleInputChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Customer Management</h1>
            <p className="text-blue-600 mt-1">Complete CRUD Operations</p>
          </div>
          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setShowEditForm(false);
              setCreateMessage(null);
            }}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Create New Customer
            </h2>

            {createMessage && (
              <div className={`mb-4 p-4 rounded-lg border ${createMessage.type === "success" ? "bg-green-100 text-green-800 border-green-300" : "bg-red-100 text-red-800 border-red-300"}`}>
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
            <div className="p-5 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-white">
              <h2 className="font-semibold text-blue-900 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
                            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg transform scale-[1.02]"
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
              <div className="p-5 border-b border-blue-100 bg-gradient-to-br from-blue-50 to-white flex justify-between items-center">
                <h2 className="font-semibold text-blue-900 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Customer Details
                </h2>
                {details && !showEditForm && (
                  <div className="flex gap-2">
                    <button
                      onClick={startEdit}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold shadow hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold shadow hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6 h-[calc(100vh-240px)] overflow-auto">
                {!details && !loading && !showEditForm && (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <p className="text-slate-500 text-lg">Select a customer to view details</p>
                  </div>
                )}

                {loading && !showEditForm && (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                  </div>
                )}

                {/* Edit Form */}
                {showEditForm && details && (
                  <div>
                    <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Customer: {details.name}
                    </h2>

                    {editMessage && (
                      <div className={`mb-4 p-4 rounded-lg border ${editMessage.type === "success" ? "bg-green-100 text-green-800 border-green-300" : "bg-red-100 text-red-800 border-red-300"}`}>
                        {editMessage.text}
                      </div>
                    )}

                    <form onSubmit={handleUpdateCustomer} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-blue-900 mb-1">Mailing Name</label>
                          <input
                            type="text"
                            name="mailingName"
                            value={formData.mailingName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          disabled={editLoading}
                          className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          {editLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                              Updating...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Update Customer
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowEditForm(false);
                            setEditMessage(null);
                          }}
                          className="px-6 py-3 border border-blue-300 text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Customer Details View */}
                {details && !loading && !showEditForm && (
                  <div className="space-y-5">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl text-white shadow-lg">
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

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Delete Customer</h3>
                  <p className="text-slate-600 text-sm mt-1">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-slate-700 mb-6">
                Are you sure you want to delete <strong className="text-slate-900">{selected}</strong>? 
                All customer data will be permanently removed.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCustomer}
                  disabled={deleteLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {deleteLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Customer
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleteLoading}
                  className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}