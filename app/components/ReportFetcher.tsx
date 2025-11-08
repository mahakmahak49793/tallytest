'use client';

import { useState } from 'react';
import DatePicker from './DatePicker';
import ReportDisplay from './ReportDisplay';

type ReportType = 'dayBook' | 'salesRegister' | 'balanceSheet' | 'profitLoss' | 'ledgerSummary';

interface ReportFilters {
  fromDate: string;
  toDate: string;
  partyName?: string;
  voucherType?: string;
}

export default function ReportFetcher() {
  const [reportType, setReportType] = useState<ReportType>('dayBook');
  const [filters, setFilters] = useState<ReportFilters>({
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState<string>('');

 // Add this to your existing ReportFetcher component
const handleFetchReport = async () => {
  setIsLoading(true);
  setError('');
  setReportData(null);
  
  try {
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reportType,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        filters
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    setReportData(data);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An error occurred';
    setError(errorMessage);
    
    // Show specific guidance for Tally connection errors
    if (errorMessage.includes('Tally') || errorMessage.includes('connection')) {
      setError(`${errorMessage}. Please ensure Tally is running and configured.`);
    }
  } finally {
    setIsLoading(false);
  }
};

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getReportTitle = (type: ReportType): string => {
    const titles = {
      dayBook: 'Day Book',
      salesRegister: 'Sales Register',
      balanceSheet: 'Balance Sheet',
      profitLoss: 'Profit & Loss Account',
      ledgerSummary: 'Ledger Summary'
    };
    return titles[type];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Fetch Tally Report
          </h1>

          {/* Report Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Report Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {(['dayBook', 'salesRegister', 'balanceSheet', 'profitLoss', 'ledgerSummary'] as ReportType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setReportType(type)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    reportType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {getReportTitle(type)}
                </button>
              ))}
            </div>
          </div>

          {/* Date Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <DatePicker
              label="From Date"
              value={filters.fromDate}
              onChange={(value) => handleFilterChange('fromDate', value)}
            />
            <DatePicker
              label="To Date"
              value={filters.toDate}
              onChange={(value) => handleFilterChange('toDate', value)}
            />
          </div>

          {/* Additional Filters based on report type */}
          {reportType === 'dayBook' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voucher Type (Optional)
              </label>
              <select
                value={filters.voucherType || ''}
                onChange={(e) => handleFilterChange('voucherType', e.target.value)}
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Voucher Types</option>
                <option value="Sales">Sales</option>
                <option value="Purchase">Purchase</option>
                <option value="Payment">Payment</option>
                <option value="Receipt">Receipt</option>
              </select>
            </div>
          )}

          {/* Fetch Button */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleFetchReport}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Fetching...' : 'Fetch Report'}
            </button>
            
            {reportData && (
              <button
                onClick={() => window.print()}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Print Report
              </button>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Report Display */}
        {reportData && (
          <ReportDisplay data={reportData} reportType={reportType} />
        )}
      </div>
    </div>
  );
}