// app/tally-data/page.tsx
'use client';

import { useState, useEffect } from 'react';

interface TallyData {
  header?: {
    tallyRequest: string;
    reportName: string;
  };
  company: {
    name: string;
    guid: string;
    currency: {
      name: string;
      symbol: string;
      displayName: string;
      subunit: string;
    };
    mailingName: string;
    code: string;
    features?: { [key: string]: string }; // Made optional
  };
  currency: {
    guid: string;
    name: string;
    mailingName: string;
    symbol: string;
    displayName: string;
    subunit: string;
    code: string;
    features?: { [key: string]: string }; // Made optional
  };
  ledgerGroups: Array<{
    name?: string | null;
    code: string;
    code1?: string | null;
    code2?: string | null;
    guid: string;
    parent?: string | null;
    number?: string | null;
    features?: { [key: string]: string }; // Made optional
  }>;
  ledgers: Array<{
    name: string;
    code: string;
    guid: string;
    currency: string;
    parent: string;
  }>;
}

export default function TallyDataPage() {
  const [data, setData] = useState<TallyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    company: true,
    currency: true,
    ledgerGroups: true,
    ledgers: true
  });

  useEffect(() => {
    fetchHardcodedData();
  }, []);

  const fetchHardcodedData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/tally-data');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Failed to fetch data: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const countActiveFeatures = (features?: { [key: string]: string }) => {
    if (!features) return 0;
    return Object.values(features).filter(v => v === 'Yes').length;
  };

  const getTotalFeatures = (features?: { [key: string]: string }) => {
    if (!features) return 0;
    return Object.keys(features).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
          <p className="text-gray-600">Loading Tally Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-6 max-w-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Tally Data Overview
              </h1>
              {data.header ? (
                <p className="text-gray-600">
                  {data.header.tallyRequest} • {data.header.reportName}
                </p>
              ) : (
                <p className="text-gray-600">Complete accounting data</p>
              )}
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div 
            className="flex items-center justify-between mb-4 cursor-pointer" 
            onClick={() => toggleSection('company')}
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-blue-600 font-bold">C</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{data.company.name}</h2>
                <p className="text-gray-500">Company Information</p>
              </div>
            </div>
            <span className="text-gray-400">{expandedSections.company ? '▼' : '▶'}</span>
          </div>
          
          {expandedSections.company && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Mailing Name</p>
                  <p className="font-medium text-gray-900">{data.company.mailingName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Company Code</p>
                  <p className="font-medium text-gray-900">{data.company.code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Currency</p>
                  <p className="font-medium text-gray-900">
                    {data.company.currency.symbol} - {data.company.currency.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Features</p>
                  <p className="font-medium text-gray-900">
                    {countActiveFeatures(data.company.features)} / {getTotalFeatures(data.company.features)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Currency Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div 
            className="flex items-center justify-between mb-4 cursor-pointer" 
            onClick={() => toggleSection('currency')}
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-green-600 font-bold">$</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Currency</h2>
                <p className="text-gray-500">{data.currency.displayName}</p>
              </div>
            </div>
            <span className="text-gray-400">{expandedSections.currency ? '▼' : '▶'}</span>
          </div>
          
          {expandedSections.currency && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{data.currency.symbol}</p>
                  <p className="text-xs text-gray-600">Symbol</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">{data.currency.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Subunit</p>
                  <p className="font-medium text-gray-900">{data.currency.subunit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Code</p>
                  <p className="font-medium text-gray-900">{data.currency.code}</p>
                </div>
              </div>
              {data.currency.features && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Features</p>
                  <p className="font-medium text-gray-900">
                    {countActiveFeatures(data.currency.features)} active
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ledger Groups */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div 
            className="flex items-center justify-between mb-4 cursor-pointer" 
            onClick={() => toggleSection('ledgerGroups')}
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-purple-600 font-bold">G</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Ledger Groups</h2>
                <p className="text-gray-500">{data.ledgerGroups.length} groups</p>
              </div>
            </div>
            <span className="text-gray-400">{expandedSections.ledgerGroups ? '▼' : '▶'}</span>
          </div>
          
          {expandedSections.ledgerGroups && (
            <div className="mt-4 space-y-3">
              {data.ledgerGroups.map((group, index) => (
                <div key={group.guid} className="border-l-4 border-purple-500 pl-4 py-3">
                  <p className="font-medium text-gray-900">
                    {group.name || `Group ${index + 1}`}
                  </p>
                  <div className="flex gap-4 text-sm text-gray-500 mt-1">
                    <span>Code: {group.code}</span>
                    {group.parent && <span>Parent: {group.parent}</span>}
                    {group.features && (
                      <span>Features: {countActiveFeatures(group.features)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ledgers */}
        <div className="bg-white rounded-lg shadow p-6">
          <div 
            className="flex items-center justify-between mb-4 cursor-pointer" 
            onClick={() => toggleSection('ledgers')}
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-orange-600 font-bold">L</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Ledgers</h2>
                <p className="text-gray-500">{data.ledgers.length} ledgers</p>
              </div>
            </div>
            <span className="text-gray-400">{expandedSections.ledgers ? '▼' : '▶'}</span>
          </div>
          
          {expandedSections.ledgers && (
            <div className="mt-4 space-y-3">
              {data.ledgers.map((ledger) => (
                <div key={ledger.guid} className="border rounded-lg p-4">
                  <p className="font-medium text-gray-900 mb-2">{ledger.name}</p>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                    <span>Code: {ledger.code}</span>
                    <span>Currency: {ledger.currency}</span>
                    <span>Parent: {ledger.parent}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}