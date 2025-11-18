// app/tally/debug/page.tsx
'use client';

import { useState } from 'react';

export default function TallyDebugPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [masterType, setMasterType] = useState('ledgers_v1');

  const testMethods = [
    { value: 'ledgers_v1', label: 'Ledgers - Method 1 (List of Accounts)' },
    { value: 'ledgers_v2', label: 'Ledgers - Method 2 (All Masters)' },
    { value: 'ledgers_v3', label: 'Ledgers - Method 3 (TDL Collection)' },
    { value: 'company', label: 'Company Info (Connection Test)' },
  ];

  const testConnection = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tally/debug', {
        method: 'GET',
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const testMasterFetch = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tally/debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ masterType }),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Tally Connection Debugger</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={testConnection}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
        >
          Test Connection
        </button>

        <div className="flex gap-2">
          <select
            value={masterType}
            onChange={(e) => setMasterType(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
          >
            {testMethods.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
          <button
            onClick={testMasterFetch}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold"
          >
            Test Fetch
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-6">
          {/* Status Card */}
          <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h2 className="text-lg font-semibold mb-2">
              {result.success ? '✅ Success' : '❌ Failed'}
            </h2>
            {result.connected !== undefined && (
              <p className="text-sm">
                Connection: {result.connected ? '✅ Connected' : '❌ Not Connected'}
              </p>
            )}
            {result.error && (
              <p className="text-red-600 text-sm mt-2">Error: {result.error}</p>
            )}
          </div>

          {/* Analysis Card */}
          {result.analysis && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">XML Structure Analysis</h3>
              <ul className="space-y-1 text-sm">
                <li>Has ENVELOPE: {result.analysis.hasEnvelope ? '✅' : '❌'}</li>
                <li>Has BODY: {result.analysis.hasBody ? '✅' : '❌'}</li>
                <li>Has TALLYMESSAGE: {result.analysis.hasTallyMessage ? '✅' : '❌'}</li>
                <li>Has LEDGER: {result.analysis.hasLedger ? '✅' : '❌'}</li>
                <li>Has COLLECTION: {result.analysis.hasCollection ? '✅' : '❌'}</li>
              </ul>
            </div>
          )}

          {/* Structure Card */}
          {result.structure && (
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Parsed Structure</h3>
              <pre className="text-xs overflow-x-auto bg-gray-50 p-3 rounded">
                {JSON.stringify(result.structure, null, 2)}
              </pre>
            </div>
          )}

          {/* XML Request */}
          {result.xmlRequest && (
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">XML Request Sent</h3>
              <pre className="text-xs overflow-x-auto bg-gray-50 p-3 rounded">
                {result.xmlRequest}
              </pre>
            </div>
          )}

          {/* XML Response Preview */}
          {result.rawXmlPreview && (
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">
                XML Response Preview (first 2000 chars)
              </h3>
              <pre className="text-xs overflow-x-auto bg-gray-50 p-3 rounded max-h-96">
                {result.rawXmlPreview}
              </pre>
            </div>
          )}

          {/* Full XML Response */}
          {result.fullXml && (
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">
                Full XML Response ({result.responseLength} chars)
              </h3>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result.fullXml);
                  alert('Copied to clipboard!');
                }}
                className="mb-2 px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                Copy Full XML
              </button>
              <pre className="text-xs overflow-x-auto bg-gray-50 p-3 rounded max-h-96">
                {result.fullXml}
              </pre>
            </div>
          )}

          {/* Raw Result */}
          <div className="bg-white border border-gray-200 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Full Response Object</h3>
            <pre className="text-xs overflow-x-auto bg-gray-50 p-3 rounded max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}