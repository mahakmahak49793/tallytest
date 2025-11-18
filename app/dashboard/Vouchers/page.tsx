"use client"
import { useState, useEffect } from 'react';
import { RefreshCw, Calendar, FileText, AlertCircle, Filter } from 'lucide-react';

interface Voucher {
  voucherNumber: string;
  voucherType: string;
  date: string;
voucherName: string;  
  amount: number;
  narration: string;
}

export default function VouchersList() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterType, setFilterType] = useState('all');

  const fetchVouchers = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = '/api/fetch-vouchers';
      const params = new URLSearchParams();
      
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setVouchers(data.vouchers || []);
      } else {
        setError(data.error || 'Failed to fetch vouchers');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const filteredVouchers = filterType === 'all' 
    ? vouchers 
    : vouchers.filter(v => v.voucherType.toLowerCase() === filterType.toLowerCase());

  const totalAmount = filteredVouchers.reduce((sum, v) => sum + v.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
       {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6 gap-6">
            <div>
              <h1 className="text-3xl font-bold text-blue-900">Vouchers Management</h1>
              <p className="text-blue-600 mt-1">View and manage all Tally vouchers</p>
            </div>
            
            {/* Compact Filters */}
            <div className="flex items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-blue-600 mb-1">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-600 mb-1">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-600 mb-1">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="all">All Types</option>
                  <option value="sales">Sales</option>
                  <option value="purchase">Purchase</option>
                  <option value="payment">Payment</option>
                  <option value="receipt">Receipt</option>
                  <option value="journal">Journal</option>
                  <option value="contra">Contra</option>
                </select>
              </div>
              <button
                onClick={fetchVouchers}
                disabled={loading}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-1.5 rounded-lg hover:shadow-lg transition-all disabled:from-gray-400 disabled:to-gray-400 font-medium text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Fetch
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Stats */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-md border border-blue-100 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-medium">Total Vouchers</p>
                  <p className="text-2xl font-bold text-blue-900">{filteredVouchers.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-blue-100 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-medium">Total Amount</p>
                  <p className="text-2xl font-bold text-green-600">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-blue-100 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Filter className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-medium">Selected Type</p>
                  <p className="text-2xl font-bold text-purple-600 capitalize">{filterType}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-md border border-blue-100 p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <p className="text-blue-900 font-medium">Fetching vouchers from Tally...</p>
          </div>
        )}

        {/* Vouchers Table */}
        {!loading && !error && filteredVouchers.length > 0 && (
          <div className="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Voucher No.</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Party Name</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-blue-900">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Narration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {filteredVouchers.map((voucher, index) => (
                    <tr key={index} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-blue-900">{voucher.voucherNumber}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                          {voucher.voucherType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">{voucher.date}</td>
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">{voucher.voucherName}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-slate-900">
                        ₹{voucher.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                        {voucher.narration || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredVouchers.length === 0 && (
          <div className="bg-white rounded-xl shadow-md border border-blue-100 p-16 text-center">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-blue-900 mb-2">No Vouchers Found</h3>
            <p className="text-blue-600">No vouchers match your selected filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}