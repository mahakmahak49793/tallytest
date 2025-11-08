'use client';

import React, { useState, ChangeEvent } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Database } from 'lucide-react';

interface ConnectionStatus {
  connected: boolean;
  message: string;
  status?: number;
}

interface UploadResult {
  success: boolean;
  message?: string;
  error?: string;
  recordCount?: number;
  tallyResponse?: string;
  details?: {
    created: number;
    altered: number;
    errors: number;
    errorMessages: string[];
  };
}

export default function TallyUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [dataType, setDataType] = useState<'item' | 'ledger'>('ledger');
  const [tallyUrl, setTallyUrl] = useState<string>('localhost');
  const [tallyPort, setTallyPort] = useState<string>('9000');
  const [uploading, setUploading] = useState<boolean>(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [testing, setTesting] = useState<boolean>(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setConnectionStatus(null);
    
    try {
      const response = await fetch(`/api/upload?tallyUrl=${tallyUrl}&tallyPort=${tallyPort}`);
      const data: ConnectionStatus = await response.json();
      setConnectionStatus(data);
    } catch (error) {
      setConnectionStatus({
        connected: false,
        message: 'Network error: ' + (error instanceof Error ? error.message : String(error))
      });
    } finally {
      setTesting(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', dataType);
    formData.append('tallyUrl', tallyUrl);
    formData.append('tallyPort', tallyPort);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data: UploadResult = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: 'Network error: ' + (error instanceof Error ? error.message : String(error)),
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleCSV = () => {
    let csv = '';
    
    if (dataType === 'item') {
      csv = 'name,category,unit,openingStock,openingValue,rate\n';
      csv += 'Laptop,Electronics,Nos,10,50000,5000\n';
      csv += 'Mouse,Electronics,Nos,50,5000,100\n';
    } else if (dataType === 'ledger') {
      csv = 'name,parent,openingBalance\n';
      csv += 'New Customer Ltd,Sundry Debtors,15000\n';
      csv += 'ABC Supplier,Sundry Creditors,-8000\n';
      csv += 'Office Expenses,Indirect Expenses,0\n';
      csv += 'Service Revenue,Indirect Incomes,0\n';
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataType}_sample.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Tally Data Upload</h1>
          <p className="text-gray-600">Upload ledgers and stock items to Tally Prime</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-indigo-600" />
            Tally Connection Settings
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tally IP/URL
              </label>
              <input
                type="text"
                value={tallyUrl}
                onChange={(e) => setTallyUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="localhost"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tally Port
              </label>
              <input
                type="text"
                value={tallyPort}
                onChange={(e) => setTallyPort(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="9000"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={testConnection}
                disabled={testing}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
          </div>

          {connectionStatus && (
            <div className={`p-4 rounded-lg flex items-start ${
              connectionStatus.connected 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {connectionStatus.connected ? (
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`font-medium ${
                  connectionStatus.connected ? 'text-green-800' : 'text-red-800'
                }`}>
                  {connectionStatus.message}
                </p>
                {!connectionStatus.connected && (
                  <p className="text-sm text-gray-600 mt-1">
                    Make sure Tally is running and ODBC Server is enabled in Tally (Gateway of Tally → F12 → Advanced Configuration → Configuration → Enable ODBC Server)
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Upload Data</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Type
            </label>
            <select
              value={dataType}
              onChange={(e) => setDataType(e.target.value as 'item' | 'ledger')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="ledger">Ledgers (Accounts)</option>
              <option value="item">Stock Items (Inventory)</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload File (CSV or JSON)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition">
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  {file ? file.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-gray-500">CSV or JSON files supported</p>
              </label>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={downloadSampleCSV}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center justify-center"
            >
              <FileText className="w-5 h-5 mr-2" />
              Download Sample CSV
            </button>
            
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Upload className="w-5 h-5 mr-2" />
              {uploading ? 'Uploading...' : 'Upload to Tally'}
            </button>
          </div>

          {result && (
            <div className={`mt-6 p-6 rounded-lg ${
              result.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start">
                {result.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className={`font-semibold text-lg mb-2 ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.success ? 'Success!' : 'Upload Failed'}
                  </h3>
                  <p className="text-gray-700 mb-2">
                    {result.message || result.error}
                  </p>
                  {result.details && (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Records processed: {result.recordCount}</p>
                      {result.details.created > 0 && (
                        <p>Newly created: {result.details.created}</p>
                      )}
                      {result.details.altered > 0 && (
                        <p>Already existed (updated): {result.details.altered}</p>
                      )}
                      {result.details.errors > 0 && (
                        <p className="text-red-600">
                          Errors: {result.details.errorMessages.join(', ')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Important Notes
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Ensure Tally Prime is running on your system</li>
            <li>• Enable ODBC Server in Tally: F12 → Advanced Configuration → Enable ODBC Server</li>
            <li>• Default Tally port is 9000</li>
            <li>• Use the sample CSV format for your data</li>
            <li>• Ledgers will be created if they don't exist, or updated if they already exist</li>
          </ul>
        </div>
      </div>
    </div>
  );
}