// "use client"
// import { useState, useEffect } from 'react';
// import { RefreshCw, Calendar, FileText, AlertCircle, Filter } from 'lucide-react';

// interface Voucher {
//   voucherNumber: string;
//   voucherType: string;
//   date: string;
// voucherName: string;  
//   amount: number;
//   narration: string;
// }

// export default function VouchersList() {
//   const [vouchers, setVouchers] = useState<Voucher[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [fromDate, setFromDate] = useState('');
//   const [toDate, setToDate] = useState('');
//   const [filterType, setFilterType] = useState('all');

//   const fetchVouchers = async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       let url = '/api/fetch-vouchers';
//       const params = new URLSearchParams();
      
//       if (fromDate) params.append('fromDate', fromDate);
//       if (toDate) params.append('toDate', toDate);
      
//       if (params.toString()) {
//         url += `?${params.toString()}`;
//       }

//       const response = await fetch(url);
//       const data = await response.json();

//       if (response.ok) {
//         setVouchers(data.vouchers || []);
//       } else {
//         setError(data.error || 'Failed to fetch vouchers');
//       }
//     } catch (err) {
//       setError('Network error. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchVouchers();
//   }, []);

//   const filteredVouchers = filterType === 'all' 
//     ? vouchers 
//     : vouchers.filter(v => v.voucherType.toLowerCase() === filterType.toLowerCase());

//   const totalAmount = filteredVouchers.reduce((sum, v) => sum + v.amount, 0);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
//       <div className="max-w-7xl mx-auto">
//        {/* Header */}
//         <div className="mb-8">
//           <div className="flex items-start justify-between mb-6 gap-6">
//             <div>
//               <h1 className="text-3xl font-bold text-blue-900">Vouchers Management</h1>
//               <p className="text-blue-600 mt-1">View and manage all Tally vouchers</p>
//             </div>
            
//             {/* Compact Filters */}
//             <div className="flex items-end gap-3">
//               <div>
//                 <label className="block text-xs font-medium text-blue-600 mb-1">From Date</label>
//                 <input
//                   type="date"
//                   value={fromDate}
//                   onChange={(e) => setFromDate(e.target.value)}
//                   className="px-3 py-1.5 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
//                 />
//               </div>
//               <div>
//                 <label className="block text-xs font-medium text-blue-600 mb-1">To Date</label>
//                 <input
//                   type="date"
//                   value={toDate}
//                   onChange={(e) => setToDate(e.target.value)}
//                   className="px-3 py-1.5 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
//                 />
//               </div>
//               <div>
//                 <label className="block text-xs font-medium text-blue-600 mb-1">Type</label>
//                 <select
//                   value={filterType}
//                   onChange={(e) => setFilterType(e.target.value)}
//                   className="px-3 py-1.5 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
//                 >
//                   <option value="all">All Types</option>
//                   <option value="sales">Sales</option>
//                   <option value="purchase">Purchase</option>
//                   <option value="payment">Payment</option>
//                   <option value="receipt">Receipt</option>
//                   <option value="journal">Journal</option>
//                   <option value="contra">Contra</option>
//                 </select>
//               </div>
//               <button
//                 onClick={fetchVouchers}
//                 disabled={loading}
//                 className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-1.5 rounded-lg hover:shadow-lg transition-all disabled:from-gray-400 disabled:to-gray-400 font-medium text-sm"
//               >
//                 <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
//                 Fetch
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Error Message */}
//         {error && (
//           <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
//             <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
//             <p className="text-red-800">{error}</p>
//           </div>
//         )}

//         {/* Stats */}
//         {!loading && !error && (
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//             <div className="bg-white rounded-xl shadow-md border border-blue-100 p-5">
//               <div className="flex items-center gap-3 mb-2">
//                 <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
//                   <FileText className="w-5 h-5 text-blue-600" />
//                 </div>
//                 <div>
//                   <p className="text-xs text-blue-600 font-medium">Total Vouchers</p>
//                   <p className="text-2xl font-bold text-blue-900">{filteredVouchers.length}</p>
//                 </div>
//               </div>
//             </div>
//             <div className="bg-white rounded-xl shadow-md border border-blue-100 p-5">
//               <div className="flex items-center gap-3 mb-2">
//                 <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
//                   <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                 </div>
//                 <div>
//                   <p className="text-xs text-blue-600 font-medium">Total Amount</p>
//                   <p className="text-2xl font-bold text-green-600">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
//                 </div>
//               </div>
//             </div>
//             <div className="bg-white rounded-xl shadow-md border border-blue-100 p-5">
//               <div className="flex items-center gap-3 mb-2">
//                 <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
//                   <Filter className="w-5 h-5 text-purple-600" />
//                 </div>
//                 <div>
//                   <p className="text-xs text-blue-600 font-medium">Selected Type</p>
//                   <p className="text-2xl font-bold text-purple-600 capitalize">{filterType}</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Loading State */}
//         {loading && (
//           <div className="bg-white rounded-xl shadow-md border border-blue-100 p-16 text-center">
//             <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
//               <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
//             </div>
//             <p className="text-blue-900 font-medium">Fetching vouchers from Tally...</p>
//           </div>
//         )}

//         {/* Vouchers Table */}
//         {!loading && !error && filteredVouchers.length > 0 && (
//           <div className="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden">
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
//                   <tr>
//                     <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Voucher No.</th>
//                     <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Type</th>
//                     <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Date</th>
//                     <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Party Name</th>
//                     <th className="px-6 py-4 text-right text-sm font-semibold text-blue-900">Amount</th>
//                     <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Narration</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-blue-50">
//                   {filteredVouchers.map((voucher, index) => (
//                     <tr key={index} className="hover:bg-blue-50 transition-colors">
//                       <td className="px-6 py-4 text-sm font-medium text-blue-900">{voucher.voucherNumber}</td>
//                       <td className="px-6 py-4">
//                         <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
//                           {voucher.voucherType}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 text-sm text-slate-700">{voucher.date}</td>
//                       <td className="px-6 py-4 text-sm text-slate-900 font-medium">{voucher.voucherName}</td>
//                       <td className="px-6 py-4 text-sm text-right font-semibold text-slate-900">
//                         ₹{voucher.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
//                       </td>
//                       <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
//                         {voucher.narration || '—'}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}

//         {/* Empty State */}
//         {!loading && !error && filteredVouchers.length === 0 && (
//           <div className="bg-white rounded-xl shadow-md border border-blue-100 p-16 text-center">
//             <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
//               <FileText className="w-10 h-10 text-blue-500" />
//             </div>
//             <h3 className="text-xl font-semibold text-blue-900 mb-2">No Vouchers Found</h3>
//             <p className="text-blue-600">No vouchers match your selected filters.</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }





























"use client"
import { useState, useEffect } from "react";
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
  Pencil,
  Trash2,
  Plus,
  X,
  Search,
  RefreshCw,
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

interface Voucher {
  guid: string;
  masterId: string;
  voucherNumber: string;
  voucherType: string;
  date: string;
  voucherName: string;
  amount: number;
  debitAmount: number;
  creditAmount: number;
  narration: string;
}

interface Result {
  type: "success" | "error";
  message: string;
}

export default function VoucherCRUD() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null);
  const [editingGuid, setEditingGuid] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    voucherType: "Sales",
    voucherNumber: "",
    date: new Date().toISOString().split("T")[0],
    partyName: "",
    amount: "",
    narration: "",
    ledgerName: "",
  });

  useEffect(() => {
    fetchVouchers();
  }, []);

  useEffect(() => {
    const filtered = vouchers.filter(
      (v) =>
        v.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.voucherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.voucherType.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredVouchers(filtered);
  }, [searchTerm, vouchers]);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/vouchers");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setVouchers(data.vouchers || []);
        setFilteredVouchers(data.vouchers || []);
      } else {
        throw new Error(data.error || "Failed to fetch vouchers");
      }
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      setResult({ 
        type: "error", 
        message: error instanceof Error ? error.message : "Failed to fetch vouchers" 
      });
      setVouchers([]);
      setFilteredVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.voucherNumber.trim()) {
      setResult({ type: "error", message: "Voucher number is required" });
      return;
    }
    if (!formData.partyName.trim()) {
      setResult({ type: "error", message: "Party name is required" });
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setResult({ type: "error", message: "Valid amount is required" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const url = editMode && editingGuid
        ? `/api/vouchers/${editingGuid}`
        : "/api/vouchers";
      const method = editMode ? "PUT" : "POST";

      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          type: "success",
          message: data.message || `Voucher ${editMode ? "updated" : "created"} successfully`,
        });
        resetForm();
        fetchVouchers();
        setShowForm(false);
      } else {
        setResult({
          type: "error",
          message: data.error || "Operation failed",
        });
      }
    } catch (error) {
      console.error("Error submitting voucher:", error);
      setResult({ 
        type: "error", 
        message: "Network error. Please try again." 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (voucher: Voucher) => {
    // Format date from DD/MM/YYYY to YYYY-MM-DD for input
    let formattedDate = voucher.date;
    if (voucher.date.includes('/')) {
      const [day, month, year] = voucher.date.split('/');
      formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    setFormData({
      voucherType: voucher.voucherType,
      voucherNumber: voucher.voucherNumber,
      date: formattedDate,
      partyName: voucher.voucherName,
      amount: voucher.amount.toString(),
      narration: voucher.narration || "",
      ledgerName: "", // You might want to populate this if available
    });
    setEditingGuid(voucher.guid);
    setEditMode(true);
    setShowForm(true);
    setResult(null);
  };

  const handleDelete = async (voucher: Voucher) => {
    if (!confirm(`Are you sure you want to delete voucher ${voucher.voucherNumber}?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/vouchers/${voucher.guid}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          type: "success",
          message: `Voucher ${voucher.voucherNumber} deleted successfully`,
        });
        fetchVouchers();
      } else {
        setResult({
          type: "error",
          message: data.error || "Failed to delete voucher",
        });
      }
    } catch (error) {
      console.error("Error deleting voucher:", error);
      setResult({ 
        type: "error", 
        message: "Network error. Please try again." 
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      voucherType: "Sales",
      voucherNumber: "",
      date: new Date().toISOString().split("T")[0],
      partyName: "",
      amount: "",
      narration: "",
      ledgerName: "",
    });
    setEditMode(false);
    setEditingGuid(null);
    setSelectedVoucher(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Voucher Management</h1>
            <p className="text-blue-600 mt-1">Create, read, update, and delete vouchers</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchVouchers}
              disabled={loading}
              className="px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
                setResult(null);
              }}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              New Voucher
            </button>
          </div>
        </div>

        {/* Result Message */}
        {result && (
          <div
            className={`mb-6 flex items-start gap-3 p-4 rounded-xl border ${
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
                result.type === "success" ? "text-green-800" : "text-red-800"
              }`}
            >
              {result.message}
            </p>
            <button
              onClick={() => setResult(null)}
              className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-white flex justify-between items-center sticky top-0 bg-white">
                <h2 className="font-semibold text-blue-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  {editMode ? "Edit Voucher" : "Create New Voucher"}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={loading}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-blue-600 mb-2">
                      <FileText className="w-4 h-4" />
                      Voucher Type
                    </label>
                    <select
                      name="voucherType"
                      value={formData.voucherType}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full rounded-lg border border-blue-200 px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="Sales">Sales</option>
                      <option value="Purchase">Purchase</option>
                      <option value="Payment">Payment</option>
                      <option value="Receipt">Receipt</option>
                      <option value="Journal">Journal</option>
                      <option value="Contra">Contra</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-blue-600 mb-2">
                      <FileText className="w-4 h-4" />
                      Voucher Number
                    </label>
                    <input
                      type="text"
                      name="voucherNumber"
                      value={formData.voucherNumber}
                      onChange={handleChange}
                      disabled={editMode || loading}
                      placeholder="e.g., V001"
                      className="w-full rounded-lg border border-blue-200 px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

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
                      disabled={loading}
                      className="w-full rounded-lg border border-blue-200 px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

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
                      min="0"
                      disabled={loading}
                      className="w-full rounded-lg border border-blue-200 px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

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
                      disabled={loading}
                      className="w-full rounded-lg border border-blue-200 px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

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
                      disabled={loading}
                      className="w-full rounded-lg border border-blue-200 px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-blue-600 mb-2">
                      <FileText className="w-4 h-4" />
                      Narration
                    </label>
                    <textarea
                      name="narration"
                      value={formData.narration}
                      onChange={handleChange}
                      placeholder="Description of the transaction..."
                      rows={4}
                      disabled={loading}
                      className="w-full rounded-lg border border-blue-200 px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-blue-100 bg-gradient-to-r from-blue-50 to-white flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  disabled={loading}
                  className="px-6 py-2.5 border border-blue-200 text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {editMode ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {editMode ? "Update" : "Create"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Vouchers List */}
        <div className="bg-white rounded-xl shadow-md border border-blue-100">
          <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="font-semibold text-blue-900">
                All Vouchers ({filteredVouchers.length})
              </h2>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vouchers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full sm:w-64"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading && vouchers.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-blue-600">Loading vouchers...</span>
              </div>
            ) : filteredVouchers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>{vouchers.length === 0 ? "No vouchers available" : "No vouchers match your search"}</p>
                {vouchers.length === 0 && (
                  <button
                    onClick={() => {
                      resetForm();
                      setShowForm(true);
                    }}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create First Voucher
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                      Voucher #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                      Party
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-blue-700 uppercase tracking-wider">
                      Debit
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-blue-700 uppercase tracking-wider">
                      Credit
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-blue-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {filteredVouchers.map((voucher) => (
                    <tr
                      key={`${voucher.guid}-${voucher.voucherNumber}`}
                      className="hover:bg-blue-50 transition-colors"
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-900">
                        {voucher.voucherNumber}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {voucher.voucherType}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {voucher.date}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {voucher.voucherName}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                        {voucher.debitAmount > 0 ? formatCurrency(voucher.debitAmount) : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                        {voucher.creditAmount > 0 ? formatCurrency(voucher.creditAmount) : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(voucher)}
                            disabled={loading}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(voucher)}
                            disabled={loading}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}