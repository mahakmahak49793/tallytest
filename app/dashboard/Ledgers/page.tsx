"use client";
import React, { useEffect, useState } from "react";

interface Ledger {
  name?: string;
  parent?: string;
  openingBalance?: string | number;
  raw?: {
    NAME?: string;
    PARENT?: string;
    [key: string]: any;
  };
}

interface LedgerListProps {
  initialCompany?: string;
}

export default function LedgerList({ initialCompany = "" }: LedgerListProps) {
  const [company, setCompany] = useState<string>(initialCompany);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  async function fetchLedgers(selectedCompany: string) {
    setLoading(true);
    setError(null);
    try {
      const q = selectedCompany
        ? `?company=${encodeURIComponent(selectedCompany)}`
        : "";
      const res = await fetch(`/api/ledgers${q}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load");
      }

      setLedgers(data.ledgers || []);
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setLedgers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialCompany) {
      fetchLedgers(initialCompany);
    }
  }, [initialCompany]);

  const handleFetchClick = () => {
    if (company.trim()) {
      fetchLedgers(company);
    } else {
      setError("Please enter a company name");
    }
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompany(e.target.value);
    setError(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleFetchClick();
    }
  };

  // Filter ledgers based on search term
  const filteredLedgers = ledgers.filter((ledger) => {
    const name = ledger.name || (ledger.raw && ledger.raw.NAME) || "";
    const parent = ledger.parent || (ledger.raw && ledger.raw.PARENT) || "";

    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parent.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  function getFormattedBalance(value: any) {
  if (!value) return null;

  const num = parseFloat(value);
  if (isNaN(num)) return null;

  const absValue = Math.abs(num).toLocaleString();
  const type = num >= 0 ? "Dr" : "Cr";

  return `${absValue} ${type}`;
}

  // Group ledgers by parent for better organization
const groupedLedgers = filteredLedgers.reduce((acc, ledger) => {
  const parent =
    ledger.parent ||
    ledger.raw?.PARENT ||
    "Others"; // better default than “Ungrouped"

  if (!acc[parent]) acc[parent] = [];
  acc[parent].push(ledger);
  return acc;
}, {} as Record<string, Ledger[]>);

  const totalBalance = filteredLedgers.reduce((sum, ledger) => {
    const balance =
      typeof ledger.openingBalance === "number"
        ? ledger.openingBalance
        : parseFloat(ledger.openingBalance as string) || 0;
    return sum + balance;
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 rounded-xl mb-8 shadow-lg">
          <h1 className="text-3xl font-bold mb-2">📊 Ledger Management</h1>
          <p className="text-blue-100 text-lg">
            View and manage your company ledgers
          </p>
        </div>

        {/* Controls Section */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                placeholder="Enter company name..."
                value={company}
                onChange={handleCompanyChange}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              />
            </div>

            <button
              onClick={handleFetchClick}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center min-w-[140px]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Loading...
                </span>
              ) : (
                "Fetch Ledgers"
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium">
                <span className="font-semibold">Error:</span> {error}
              </p>
            </div>
          )}
        </div>

        {/* Results Section */}
        {!loading && !error && (ledgers.length > 0 || searchTerm) && (
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 mb-6">
            {/* Stats and Search */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
              <div>
                <h3 className="text-xl font-semibold text-slate-800">
                  {filteredLedgers.length} of {ledgers.length} Ledgers
                  {searchTerm && (
                    <span className="text-slate-600"> matching "{searchTerm}"</span>
                  )}
                </h3>
                {/* {totalBalance !== 0 && (
                  <p className="text-slate-600 mt-1">
                    Total Opening Balance:{" "}
                    <span className="font-semibold text-green-600">
                      ₹{totalBalance.toLocaleString()}
                    </span>
                  </p>
                )} */}
              </div>

              <div className="w-full lg:w-auto">
                <input
                  type="text"
                  placeholder="Search ledgers..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full lg:w-64 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Ledgers Table */}
            {Object.keys(groupedLedgers).length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                        Ledger Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                        Parent Group
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                        Opening Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {Object.entries(groupedLedgers).map(
                      ([parent, parentLedgers]) => (
                        <React.Fragment key={parent}>
                          <tr className="bg-blue-50">
                            <td
                              colSpan={4}
                              className="px-4 py-3 text-sm font-semibold text-blue-700 uppercase tracking-wide"
                            >
                              📁 {parent}
                            </td>
                          </tr>
                          {parentLedgers.map((ledger, index) => (
                            <tr
                              key={index}
                              className="hover:bg-slate-50 transition-colors duration-150"
                            >
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {index + 1}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                {ledger.name ||
                                  (ledger.raw && ledger.raw.NAME) ||
                                  "—"}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {ledger.parent ||
                                  (ledger.raw && ledger.raw.PARENT) ||
                                  "—"}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-medium">
  {ledger.openingBalance ? (
    <span className="text-slate-900 font-semibold">
      {getFormattedBalance(ledger.openingBalance)}
    </span>
  ) : (
    <span className="text-slate-400">—</span>
  )}
</td>

                            </tr>
                          ))}
                        </React.Fragment>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  No matching ledgers found
                </h3>
                <p className="text-slate-500">Try adjusting your search terms</p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && ledgers.length === 0 && company && (
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-8 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              No Ledgers Found
            </h3>
            <p className="text-slate-600">
              No ledgers were found for company "{company}". Make sure the company
              exists and has ledgers in Tally.
            </p>
          </div>
        )}

        {/* Initial State */}
        {!loading && !error && ledgers.length === 0 && !company && (
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-8 text-center">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              Ready to Explore Ledgers
            </h3>
            <p className="text-slate-600">
              Enter a company name above to fetch and view its ledgers
            </p>
          </div>
        )}
      </div>
    </div>
  );
}