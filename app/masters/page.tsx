"use client"
import { JSX, useState } from 'react';

interface TallyData {
  ENVELOPE?: {
    BODY?: {
      IMPORTDATA?: {
        REQUESTDATA?: {
          TALLYMESSAGE?: any[] | any;
        };
      };
    };
  };
}

export default function MastersPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'overview' | 'ledgers' | 'groups' | 'vouchers' | 'raw'>('overview');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setData(null);
    setCopyStatus('idle');
    setExpandedSections(new Set());
    setActiveTab('overview');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/tally/masters', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Failed to process file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (path: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedSections(newExpanded);
  };

  const downloadJson = () => {
    if (!data?.data) return;

    const jsonString = JSON.stringify(data.data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `tally-masters-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyJsonToClipboard = async () => {
    if (!data?.data) return;

    try {
      const jsonString = JSON.stringify(data.data, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setCopyStatus('success');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  // Helper function to parse balance and determine DR/CR
  const parseBalance = (balanceStr: string | number | undefined): { amount: number; type: 'Dr' | 'Cr' } => {
    if (!balanceStr) return { amount: 0, type: 'Dr' };
    
    const str = String(balanceStr).trim();
    const amount = Math.abs(parseFloat(str.replace(/[^\d.-]/g, '')) || 0);
    
    // Negative amounts or amounts with '-' are Credit
    const type = str.includes('-') || parseFloat(str) < 0 ? 'Cr' : 'Dr';
    
    return { amount, type };
  };

  // Format balance with DR/CR
  const formatBalance = (balanceStr: string | number | undefined): string => {
    const { amount, type } = parseBalance(balanceStr);
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${type}`;
  };

  // Safe data extraction with proper error handling
  const extractTallyDetails = (data: TallyData) => {
    if (!data?.ENVELOPE?.BODY?.IMPORTDATA?.REQUESTDATA?.TALLYMESSAGE) {
      return null;
    }

    const tallyMessages = data.ENVELOPE.BODY.IMPORTDATA.REQUESTDATA.TALLYMESSAGE;
    const messagesArray = Array.isArray(tallyMessages) ? tallyMessages : [tallyMessages];

    // Safe filtering with existence checks
    const ledgers = messagesArray.filter((msg: any) => msg?.LEDGER);
    const groups = messagesArray.filter((msg: any) => msg?.GROUP);
    const vouchers = messagesArray.filter((msg: any) => msg?.VOUCHER);
    const costCenters = messagesArray.filter((msg: any) => msg?.COSTCENTRE);
    const currencies = messagesArray.filter((msg: any) => msg?.CURRENCY);
    const units = messagesArray.filter((msg: any) => msg?.UNIT);
    const stockItems = messagesArray.filter((msg: any) => msg?.STOCKITEM);

    // Extract ledger details safely with proper balance parsing
    const ledgerDetails = ledgers.map((msg: any) => {
      const ledger = msg.LEDGER || {};
      const openingBalance = parseBalance(ledger.OPENINGBALANCE);
      const closingBalance = parseBalance(ledger.CLOSINGBALANCE);
      
      return {
        name: ledger.NAME || 'Unnamed',
        parent: ledger.PARENT || 'No Parent',
        openingBalance: ledger.OPENINGBALANCE || '0',
        closingBalance: ledger.CLOSINGBALANCE || '0',
        openingBalanceParsed: openingBalance,
        closingBalanceParsed: closingBalance,
        description: ledger.DESCRIPTION || '',
        taxType: ledger.TAXTYPE || '',
        isRevenue: ledger.ISREVENUE || 'No',
        isDeemedPositive: ledger.ISDEEMEDPOSITIVE || 'No',
        address: ledger.ADDRESS || '',
        country: ledger.COUNTRYNAME || ''
      };
    });

    // Extract group details safely
    const groupDetails = groups.map((msg: any) => ({
      name: msg.GROUP?.NAME || 'Unnamed',
      parent: msg.GROUP?.PARENT || 'No Parent'
    }));

    // Extract voucher details safely with robust error handling
    const voucherDetails = vouchers.map((msg: any) => {
      const voucher = msg.VOUCHER || {};
      
      // Safely extract ledger entries with multiple fallback approaches
      let ledgerEntries: any[] = [];
      
      if (voucher.ALLLEDGERENTRIES?.LEDGERENTRY) {
        ledgerEntries = Array.isArray(voucher.ALLLEDGERENTRIES.LEDGERENTRY) 
          ? voucher.ALLLEDGERENTRIES.LEDGERENTRY 
          : [voucher.ALLLEDGERENTRIES.LEDGERENTRY];
      } else if (voucher.LEDGERENTRY) {
        ledgerEntries = Array.isArray(voucher.LEDGERENTRY) 
          ? voucher.LEDGERENTRY 
          : [voucher.LEDGERENTRY];
      } else if (voucher.ALLLEDGERENTRIES && Array.isArray(voucher.ALLLEDGERENTRIES)) {
        ledgerEntries = voucher.ALLLEDGERENTRIES;
      }
      
      // Calculate total amount safely
      const totalAmount = ledgerEntries.reduce((sum: number, entry: any) => {
        try {
          const amount = parseFloat(entry?.AMOUNT) || 0;
          return entry?.ISDEEMEDPOSITIVE === 'Yes' ? sum - amount : sum + amount;
        } catch {
          return sum;
        }
      }, 0);

      // Extract entry details safely with DR/CR
      const entries = ledgerEntries.map((entry: any) => {
        const amount = Math.abs(parseFloat(entry?.AMOUNT || '0'));
        const isDeemedPositive = entry?.ISDEEMEDPOSITIVE === 'Yes';
        
        return {
          ledger: entry?.LEDGERNAME || entry?.LEDGER?.NAME || 'Unknown',
          amount: entry?.AMOUNT || '0',
          amountParsed: amount,
          type: isDeemedPositive ? 'Cr' : 'Dr',
          isDeemedPositive
        };
      });

      return {
        voucherNumber: voucher.VOUCHERNUMBER || `Voucher-${Math.random().toString(36).substr(2, 9)}`,
        date: voucher.DATE || 'N/A',
        voucherType: voucher.VOUCHERTYPENAME || voucher.VOUCHERTYPE || 'N/A',
        narration: voucher.NARRATION || '',
        totalAmount,
        entries,
        rawData: voucher
      };
    });

    // Calculate totals safely - separate DR and CR
    const totalOpeningDr = ledgerDetails.reduce((sum: number, ledger: any) => {
      return ledger.openingBalanceParsed.type === 'Dr' ? sum + ledger.openingBalanceParsed.amount : sum;
    }, 0);
    
    const totalOpeningCr = ledgerDetails.reduce((sum: number, ledger: any) => {
      return ledger.openingBalanceParsed.type === 'Cr' ? sum + ledger.openingBalanceParsed.amount : sum;
    }, 0);

    const totalClosingDr = ledgerDetails.reduce((sum: number, ledger: any) => {
      return ledger.closingBalanceParsed.type === 'Dr' ? sum + ledger.closingBalanceParsed.amount : sum;
    }, 0);
    
    const totalClosingCr = ledgerDetails.reduce((sum: number, ledger: any) => {
      return ledger.closingBalanceParsed.type === 'Cr' ? sum + ledger.closingBalanceParsed.amount : sum;
    }, 0);

    const totalVoucherAmount = voucherDetails.reduce((sum: number, voucher: any) => 
      sum + Math.abs(voucher.totalAmount || 0), 0);

    return {
      summary: {
        totalLedgers: ledgers.length,
        totalGroups: groups.length,
        totalVouchers: vouchers.length,
        totalCostCenters: costCenters.length,
        totalCurrencies: currencies.length,
        totalUnits: units.length,
        totalStockItems: stockItems.length,
        totalOpeningDr,
        totalOpeningCr,
        totalClosingDr,
        totalClosingCr,
        totalVoucherAmount
      },
      ledgers: ledgerDetails,
      groups: groupDetails,
      vouchers: voucherDetails,
      other: {
        costCenters,
        currencies,
        units,
        stockItems
      },
      debug: {
        rawMessagesCount: messagesArray.length,
        sampleVoucher: vouchers[0]
      }
    };
  };

  const tallyDetails = data?.data ? extractTallyDetails(data.data) : null;

  // Render human-readable data
  const renderHumanReadableData = (obj: any, path = ''): JSX.Element => {
    if (obj === null || obj === undefined) {
      return <span className="text-gray-500 italic">null</span>;
    }

    if (typeof obj === 'boolean') {
      return <span className="text-purple-600">{obj.toString()}</span>;
    }

    if (typeof obj === 'number') {
      return <span className="text-blue-600">{obj.toLocaleString()}</span>;
    }

    if (typeof obj === 'string') {
      if (/^\d{4}-\d{2}-\d{2}/.test(obj) || /^\d{2}\/\d{2}\/\d{4}/.test(obj)) {
        return <span className="text-green-600">"{obj}"</span>;
      }
      if (obj.length <= 50 && (/^[A-Z0-9_]+$/.test(obj) || /^[a-zA-Z0-9]+$/.test(obj))) {
        return <span className="text-orange-600">"{obj}"</span>;
      }
      if (obj.length > 50) {
        const truncated = obj.length > 100 ? obj.substring(0, 100) + '...' : obj;
        return (
          <span className="text-gray-700">
            "{truncated}"
            {obj.length > 100 && <span className="text-xs text-gray-500 ml-1">({obj.length} chars)</span>}
          </span>
        );
      }
      return <span className="text-gray-700">"{obj}"</span>;
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return <span className="text-gray-500 italic">[] (empty array)</span>;
      }

      const currentPath = path;
      const isExpanded = expandedSections.has(currentPath);

      return (
        <div className="ml-4 border-l-2 border-gray-200 pl-3">
          <div 
            className="flex items-center cursor-pointer hover:bg-gray-50 py-1"
            onClick={() => toggleSection(currentPath)}
          >
            <svg 
              className={`w-4 h-4 mr-2 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-medium text-purple-700">
              Array [{obj.length} item{obj.length !== 1 ? 's' : ''}]
            </span>
          </div>
          
          {isExpanded && (
            <div className="mt-1 space-y-2">
              {obj.map((item, index) => (
                <div key={index} className="flex items-start">
                  <span className="text-blue-600 font-mono text-sm mr-2 mt-1">[{index}]:</span>
                  <div className="flex-1">
                    {renderHumanReadableData(item, `${currentPath}[${index}]`)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      if (keys.length === 0) {
        return <span className="text-gray-500 italic">{} (empty object)</span>;
      }

      const currentPath = path;
      const isExpanded = expandedSections.has(currentPath);

      return (
        <div className="ml-4 border-l-2 border-gray-200 pl-3">
          <div 
            className="flex items-center cursor-pointer hover:bg-gray-50 py-1"
            onClick={() => toggleSection(currentPath)}
          >
            <svg 
              className={`w-4 h-4 mr-2 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-medium text-green-700">
              Object ({keys.length} propert{keys.length !== 1 ? 'ies' : 'y'})
            </span>
          </div>
          
          {isExpanded && (
            <div className="mt-1 space-y-2">
              {keys.map(key => (
                <div key={key} className="flex items-start">
                  <span className="font-semibold text-green-800 mr-2 mt-1 min-w-0 break-words max-w-40">
                    {key}:
                  </span>
                  <div className="flex-1 min-w-0">
                    {renderHumanReadableData(obj[key], `${currentPath}.${key}`)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return <span>{String(obj)}</span>;
  };

  // Tab content components with safe rendering
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      {tallyDetails && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{tallyDetails.summary.totalLedgers}</div>
            <div className="text-sm text-blue-600">Ledgers</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-700">{tallyDetails.summary.totalGroups}</div>
            <div className="text-sm text-green-600">Groups</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-700">{tallyDetails.summary.totalVouchers}</div>
            <div className="text-sm text-purple-600">Vouchers</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-700">{tallyDetails.summary.totalCostCenters}</div>
            <div className="text-sm text-orange-600">Cost Centers</div>
          </div>
        </div>
      )}

      {/* Financial Summary */}
      {tallyDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-3">Opening Balance</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Debit:</span>
                <span className="text-lg font-bold text-red-600">
                  ₹{tallyDetails.summary.totalOpeningDr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dr
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Credit:</span>
                <span className="text-lg font-bold text-green-600">
                  ₹{tallyDetails.summary.totalOpeningCr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-3">Closing Balance</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Debit:</span>
                <span className="text-lg font-bold text-red-600">
                  ₹{tallyDetails.summary.totalClosingDr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dr
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Credit:</span>
                <span className="text-lg font-bold text-green-600">
                  ₹{tallyDetails.summary.totalClosingCr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Ledgers */}
      {tallyDetails && tallyDetails.ledgers.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-3">Recent Ledgers</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {tallyDetails.ledgers.slice(0, 10).map((ledger: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{ledger.name}</div>
                  <div className="text-sm text-gray-500">Parent: {ledger.parent}</div>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${ledger.openingBalanceParsed.type === 'Dr' ? 'text-red-600' : 'text-green-600'}`}>
                    {formatBalance(ledger.openingBalance)}
                  </div>
                  <div className="text-sm text-gray-500">Opening</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const LedgersTab = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Opening Balance</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Closing Balance</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tax Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tallyDetails?.ledgers.map((ledger: any, index: number) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{ledger.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{ledger.parent}</td>
                <td className={`px-4 py-3 text-sm font-medium text-right ${
                  ledger.openingBalanceParsed.type === 'Dr' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatBalance(ledger.openingBalance)}
                </td>
                <td className={`px-4 py-3 text-sm font-medium text-right ${
                  ledger.closingBalanceParsed.type === 'Dr' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatBalance(ledger.closingBalance)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{ledger.taxType || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const VouchersTab = () => (
    <div className="space-y-4">
      {tallyDetails?.vouchers && tallyDetails.vouchers.length > 0 ? (
        tallyDetails.vouchers.map((voucher: any, index: number) => (
          <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{voucher.voucherNumber}</h4>
                <p className="text-sm text-gray-500">{voucher.voucherType} • {voucher.date}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  ₹{Math.abs(voucher.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
            
            {voucher.narration && (
              <p className="text-sm text-gray-600 mb-3 italic bg-gray-50 p-2 rounded">{voucher.narration}</p>
            )}
            
            {voucher.entries && voucher.entries.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Ledger Entries:</div>
                {voucher.entries.map((entry: any, entryIndex: number) => (
                  <div key={entryIndex} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                    <span className="font-medium text-gray-700">
                      {entry.ledger}
                    </span>
                    <span className={`font-semibold ${entry.type === 'Dr' ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{entry.amountParsed.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {entry.type}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No ledger entries found</p>
            )}
          </div>
        ))
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-700">No vouchers found in the uploaded file</p>
        </div>
      )}
    </div>
  );

  const GroupsTab = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent Group</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tallyDetails?.groups.map((group: any, index: number) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{group.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{group.parent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const RawDataTab = () => (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-4">Data Structure</h3>
        <div className="font-mono text-sm overflow-auto max-h-96 p-4 bg-gray-50 rounded border">
          {renderHumanReadableData(data.data)}
        </div>
      </div>
      
      <details className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
        <summary className="cursor-pointer font-semibold text-gray-800 p-4 hover:bg-gray-100 transition-colors">
          Raw JSON Data (click to expand)
        </summary>
        <div className="p-4 border-t border-gray-200">
          <pre className="text-xs overflow-auto max-h-96 bg-gray-900 text-gray-100 p-4 rounded">
            {JSON.stringify(data.data, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">Tally Masters Viewer</h1>
      <p className="text-gray-600 mb-6">Upload and analyze Tally XML files with detailed data visualization</p>
      
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Upload Tally XML File (DayBook.xml or Masters export)
        </label>
        <input
          type="file"
          accept=".xml"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          disabled={loading}
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-blue-600">Processing XML file...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Error</span>
          </div>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {data && (
        <div>
          {/* Action Buttons */}
          <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <h2 className="text-xl font-semibold text-gray-800">Tally Data Analysis</h2>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={downloadJson}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download JSON
              </button>
              
              <button
                onClick={copyJsonToClipboard}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  copyStatus === 'success' 
                    ? 'bg-green-600 text-white' 
                    : copyStatus === 'error'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                {copyStatus === 'success' ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : copyStatus === 'error' ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Failed
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy JSON
                  </>
                )}
              </button>
            </div>
          </div>
       
          
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', count: tallyDetails ? Object.keys(tallyDetails.summary).length : 0 },
                { id: 'ledgers', name: 'Ledgers', count: tallyDetails?.summary.totalLedgers },
                { id: 'groups', name: 'Groups', count: tallyDetails?.summary.totalGroups },
                { id: 'vouchers', name: 'Vouchers', count: tallyDetails?.summary.totalVouchers },
                { id: 'raw', name: 'Raw Data', count: null }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                  {tab.count !== null && (
                    <span className={`ml-2 py-0.5 px-2 text-xs rounded-full ${
                      activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-900'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="min-h-96">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'ledgers' && <LedgersTab />}
            {activeTab === 'groups' && <GroupsTab />}
            {activeTab === 'vouchers' && <VouchersTab />}
            {activeTab === 'raw' && <RawDataTab />}
          </div>
        </div>
      )}
    </div>
  );
}