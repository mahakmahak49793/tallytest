"use client"
import { useState, useEffect } from 'react';

export default function BalanceSheet() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fromDate, setFromDate] = useState('20240401');
  const [toDate, setToDate] = useState('20250331');

  const fetchBalanceSheet = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/balancesheet?fromDate=${fromDate}&toDate=${toDate}`
      );
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err:any) {
      setError(err.message || 'Failed to fetch balance sheet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalanceSheet();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
            Balance Sheet from Tally
          </h1>

          <div className="mb-6 flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date (YYYYMMDD)
              </label>
              <input
                type="text"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="20240401"
              />
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date (YYYYMMDD)
              </label>
              <input
                type="text"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="20250331"
              />
            </div>
            
            <button
              onClick={fetchBalanceSheet}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Loading...' : 'Fetch Data'}
            </button>
          </div>

          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">Error: {error}</p>
                </div>
              </div>
            </div>
          )}

          {data && !loading && (
            <div className="mt-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6">
                <h2 className="text-xl font-semibold text-green-800 mb-2">
                  ✓ Data Fetched Successfully
                </h2>
                <p className="text-sm text-green-600">
                  Balance sheet data retrieved from Tally
                </p>
              </div>

              {/* Formatted Balance Sheet Table */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                  <h2 className="text-2xl font-bold text-white">Balance Sheet</h2>
                  <p className="text-blue-100 text-sm mt-1">Period: {fromDate} to {toDate}</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Particulars</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Amount (₹)</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.ENVELOPE?.BSNAME?.map((item, index) => {
                        const accountName = item.DSPACCNAME?.[0]?.DSPDISPNAME?.[0] || 'N/A';
                        const amount = data.ENVELOPE?.BSAMT?.[index]?.BSMAINAMT?.[0] || '0.00';
                        const percentage = data.ENVELOPE?.BSAMT?.[index]?.BSPERCENT?.[0] || '0 %';
                        const numAmount = parseFloat(amount.replace(/,/g, ''));
                        
                        const isLiability = ['Capital Account', 'Loans (Liability)', 'Current Liabilities'].includes(accountName);
                        const isAsset = ['Current Assets', 'Fixed Assets'].includes(accountName);
                        const isProfitLoss = accountName === 'Profit & Loss A/c';
                        
                        return (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {isLiability && (
                                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                )}
                                {isAsset && (
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                )}
                                {isProfitLoss && (
                                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                )}
                                <span className="text-gray-800 font-medium">{accountName}</span>
                              </div>
                            </td>
                            <td className={`px-6 py-4 text-right font-mono ${
                              numAmount < 0 ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {numAmount === 0 ? '-' : numAmount.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-600 font-medium">
                              {percentage || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gradient-to-r from-gray-100 to-gray-50 border-t-2 border-gray-300">
                      <tr>
                        <td className="px-6 py-4 text-left font-bold text-gray-800">Total</td>
                        <td className="px-6 py-4 text-right font-bold font-mono text-gray-900">
                          {(() => {
                            const total = data.ENVELOPE?.BSAMT?.reduce((sum, item) => {
                              const amt = parseFloat((item.BSMAINAMT?.[0] || '0').replace(/,/g, ''));
                              return sum + (isNaN(amt) ? 0 : amt);
                            }, 0) || 0;
                            return total.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            });
                          })()}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-gray-800">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <h3 className="font-semibold text-red-900">Liabilities</h3>
                  </div>
                  <p className="text-sm text-red-700">Capital, Loans & Current Liabilities</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <h3 className="font-semibold text-green-900">Assets</h3>
                  </div>
                  <p className="text-sm text-green-700">Current Assets & Fixed Assets</p>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <h3 className="font-semibold text-blue-900">Profit & Loss</h3>
                  </div>
                  <p className="text-sm text-blue-700">Net Profit/Loss for the period</p>
                </div>
              </div>

              {/* Toggle Raw Data */}
              <details className="mt-6">
                <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 px-4 py-2 rounded-lg">
                  Show Raw JSON Data
                </summary>
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mt-2">
                  <pre className="bg-white p-4 rounded-lg overflow-auto max-h-96 text-xs border border-gray-300">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}

          {!data && !loading && !error && (
            <div className="text-center py-12 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg">Click "Fetch Data" to load balance sheet from Tally</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}