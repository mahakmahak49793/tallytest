
// Frontend Component: /app/components/TallyReportFetch.tsx
"use client"
import { useState, useEffect } from 'react';
import { Calendar, FileText, TrendingUp, BarChart3, BookOpen, Download, Loader2, AlertCircle, CheckCircle, Wifi, WifiOff, Eye, Code } from 'lucide-react';

const reportTypes = [
  { id: 'daybook', name: 'Day Book', icon: BookOpen, description: 'All vouchers for a period' },
  { id: 'sales', name: 'Sales Register', icon: TrendingUp, description: 'Sales summary report' },
  { id: 'balance', name: 'Balance Sheet', icon: BarChart3, description: 'Assets and liabilities' },
  { id: 'pl', name: 'Profit & Loss', icon: FileText, description: 'Income and expenses' },
  { id: 'ledger', name: 'Ledger Summary', icon: Calendar, description: 'Account-wise summary' }
];

interface ReportData {
  success: boolean;
  reportType: string;
  fromDate: string;
  toDate: string;
  data: any;
  rawXml: string;
  format: string;
}

export default function TallyReportFetch() {
  const [selectedReport, setSelectedReport] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [viewMode, setViewMode] = useState<'formatted' | 'json' | 'xml'>('formatted');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/reports');
      const data = await response.json();
      setConnectionStatus(data.status === 'connected' ? 'connected' : 'disconnected');
    } catch (err) {
      setConnectionStatus('disconnected');
    }
  };

  const handleFetchReport = async () => {
    if (!selectedReport || !fromDate || !toDate) {
      setError('Please select report type and date range');
      return;
    }

    setLoading(true);
    setError('');
    setReportData(null);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: selectedReport,
          fromDate,
          toDate
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch report');
      }

      setReportData(data);
      setViewMode('formatted');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (format: 'json' | 'xml') => {
    if (!reportData) return;
    
    const content = format === 'json' 
      ? JSON.stringify(reportData.data, null, 2)
      : reportData.rawXml;
    
    const mimeType = format === 'json' ? 'application/json' : 'application/xml';
    const extension = format;
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tally-${selectedReport}-${fromDate}-to-${toDate}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderFormattedData = (data: any) => {
    if (!data) return null;

    const renderObject = (obj: any, level: number = 0): JSX.Element => {
      if (obj === null || obj === undefined) {
        return <span className="text-gray-400 italic">null</span>;
      }

      if (typeof obj !== 'object') {
        return <span className="text-blue-600">{String(obj)}</span>;
      }

      if (Array.isArray(obj)) {
        return (
          <div className="ml-4">
            {obj.map((item, index) => (
              <div key={index} className="mb-2 border-l-2 border-gray-200 pl-4">
                <span className="text-gray-500 font-mono text-xs">[{index}]</span>
                <div className="ml-2">{renderObject(item, level + 1)}</div>
              </div>
            ))}
          </div>
        );
      }

      return (
        <div className={level > 0 ? 'ml-4' : ''}>
          {Object.entries(obj).map(([key, value]) => (
            <div key={key} className="mb-2 border-l-2 border-indigo-100 pl-4 py-1">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-indigo-700 min-w-fit">{key}:</span>
                <div className="flex-1">{renderObject(value, level + 1)}</div>
              </div>
            </div>
          ))}
        </div>
      );
    };

    return renderObject(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 rounded-xl">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Tally Report Fetch</h1>
                <p className="text-gray-500">Fetch real-time reports from Tally ERP</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50">
              {connectionStatus === 'connected' ? (
                <>
                  <Wifi className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-green-700">Connected</span>
                </>
              ) : connectionStatus === 'checking' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Checking...</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium text-red-700">Disconnected</span>
                </>
              )}
              <button
                onClick={checkConnection}
                className="ml-2 text-xs text-indigo-600 hover:text-indigo-700 underline"
              >
                Refresh
              </button>
            </div>
          </div>

          {connectionStatus === 'disconnected' && (
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-yellow-800 font-medium">Cannot connect to Tally</p>
                  <p className="text-sm text-yellow-700 mt-1">Please ensure:</p>
                  <ul className="text-sm text-yellow-700 list-disc list-inside mt-1">
                    <li>Tally is running</li>
                    <li>Gateway of Tally → F12 → Advanced Configuration → Enable API</li>
                    <li>Port 9000 is accessible</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              return (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedReport === report.id
                      ? 'border-indigo-600 bg-indigo-50 shadow-md'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-8 h-8 mb-2 ${selectedReport === report.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <h3 className="font-semibold text-gray-800 mb-1">{report.name}</h3>
                  <p className="text-sm text-gray-500">{report.description}</p>
                </button>
              );
            })}
          </div>

          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-700 mb-4">Select Date Range</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleFetchReport}
            disabled={loading || !selectedReport || !fromDate || !toDate || connectionStatus !== 'connected'}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Fetching Report...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Fetch Report from Tally
              </>
            )}
          </button>

          {error && (
            <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          {reportData && (
            <div className="mt-6 bg-green-50 border-l-4 border-green-500 rounded-xl overflow-hidden">
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-800">Report Fetched Successfully</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload('json')}
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      JSON
                    </button>
                    <button
                      onClick={() => handleDownload('xml')}
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      XML
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setViewMode('formatted')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      viewMode === 'formatted'
                        ? 'bg-white text-green-700 shadow'
                        : 'bg-green-100 text-green-600 hover:bg-white'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    Formatted View
                  </button>
                  <button
                    onClick={() => setViewMode('json')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      viewMode === 'json'
                        ? 'bg-white text-green-700 shadow'
                        : 'bg-green-100 text-green-600 hover:bg-white'
                    }`}
                  >
                    <Code className="w-4 h-4" />
                    JSON
                  </button>
                  <button
                    onClick={() => setViewMode('xml')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      viewMode === 'xml'
                        ? 'bg-white text-green-700 shadow'
                        : 'bg-green-100 text-green-600 hover:bg-white'
                    }`}
                  >
                    <Code className="w-4 h-4" />
                    XML
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 max-h-[600px] overflow-auto border-t border-green-200">
                {viewMode === 'formatted' && (
                  <div className="text-sm">
                    {renderFormattedData(reportData.data)}
                  </div>
                )}
                {viewMode === 'json' && (
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                    {JSON.stringify(reportData.data, null, 2)}
                  </pre>
                )}
                {viewMode === 'xml' && (
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                    {reportData.rawXml}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}