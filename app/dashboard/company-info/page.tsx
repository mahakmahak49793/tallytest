"use client"
import React, { useState, useEffect } from 'react';
import { Building2, RefreshCw, Database, Calendar, Phone, Mail, MapPin, Hash, Globe, MapPinned, CheckCircle2, AlertCircle } from 'lucide-react';

interface Company {
  guid: string;
  name: string;
  companyNumber: string;
  startingFrom: string;
  booksFrom: string;
  address: string;
  email: string;
  phone: string;
}

interface CurrentCompany {
  name: string;
  guid: string;
  companyNumber: string;
  address: string;
  email: string;
  phone: string;
  booksFrom: string;
  startingFrom: string;
  pinCode: string;
  state: string;
  country: string;
}

export default function TallyDashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentCompany, setCurrentCompany] = useState<CurrentCompany | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies');
      const data = await response.json();
      
      if (data.success) {
        setCompanies(data.data);
        return true;
      } else {
        setError(data.error || 'Failed to fetch companies');
        return false;
      }
    } catch (err) {
      setError('Failed to connect to Tally. Make sure Tally is running with ODBC enabled on port 9000.');
      return false;
    }
  };

  // const fetchCurrentCompany = async () => {
  //   try {
  //     const response = await fetch('/api/company-info');
  //     const data = await response.json();
      
  //     if (data.success) {
  //       setCurrentCompany(data.data);
  //       return true;
  //     } else {
  //       setCurrentCompany(null);
  //       return false;
  //     }
  //   } catch (err) {
  //     setCurrentCompany(null);
  //     return false;
  //   }
  // };

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    
    const [companiesSuccess, currentSuccess] = await Promise.all([
      fetchCompanies(),
      fetchCurrentCompany()
    ]);
    
    if (companiesSuccess || currentSuccess) {
      setLastUpdated(new Date());
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    return dateString;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-xl shadow-lg">
                <Database className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Tally Integration</h1>
                <p className="text-slate-600 mt-1">Company Management Dashboard</p>
                {lastUpdated && (
                  <p className="text-xs text-slate-500 mt-1">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
            
            <button
              onClick={fetchAll}
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-6 py-4 rounded-lg mb-6 shadow-md flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Current Company Section */}
        {currentCompany && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl p-6 mb-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-green-600 p-3 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Currently Open Company</h2>
                <p className="text-green-700 text-sm">Active in Tally</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Company Name */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-slate-500 font-medium">Company Name</p>
                </div>
                <p className="text-xl font-bold text-slate-800">{currentCompany.name}</p>
              </div>

              {/* Company Number */}
              {currentCompany.companyNumber && (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-5 h-5 text-blue-600" />
                    <p className="text-sm text-slate-500 font-medium">Company Number</p>
                  </div>
                  <p className="text-lg font-semibold text-slate-800">{currentCompany.companyNumber}</p>
                </div>
              )}

              {/* Books From */}
              {currentCompany.booksFrom && (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <p className="text-sm text-slate-500 font-medium">Books From</p>
                  </div>
                  <p className="text-lg font-semibold text-slate-800">{formatDate(currentCompany.booksFrom)}</p>
                </div>
              )}

              {/* Starting From */}
              {currentCompany.startingFrom && (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <p className="text-sm text-slate-500 font-medium">Starting From</p>
                  </div>
                  <p className="text-lg font-semibold text-slate-800">{formatDate(currentCompany.startingFrom)}</p>
                </div>
              )}

              {/* Address */}
              {currentCompany.address && (
                <div className="bg-white rounded-xl p-4 shadow-sm md:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-slate-500 font-medium">Address</p>
                  </div>
                  <p className="text-slate-800">{currentCompany.address}</p>
                </div>
              )}

              {/* Email */}
              {currentCompany.email && (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-5 h-5 text-orange-600" />
                    <p className="text-sm text-slate-500 font-medium">Email</p>
                  </div>
                  <p className="text-slate-800 break-all">{currentCompany.email}</p>
                </div>
              )}

              {/* Phone */}
              {currentCompany.phone && (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-5 h-5 text-teal-600" />
                    <p className="text-sm text-slate-500 font-medium">Phone</p>
                  </div>
                  <p className="text-slate-800">{currentCompany.phone}</p>
                </div>
              )}

              {/* State */}
              {currentCompany.state && (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPinned className="w-5 h-5 text-pink-600" />
                    <p className="text-sm text-slate-500 font-medium">State</p>
                  </div>
                  <p className="text-slate-800">{currentCompany.state}</p>
                </div>
              )}

              {/* Country */}
              {currentCompany.country && (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-5 h-5 text-cyan-600" />
                    <p className="text-sm text-slate-500 font-medium">Country</p>
                  </div>
                  <p className="text-slate-800">{currentCompany.country}</p>
                </div>
              )}

              {/* Pin Code */}
              {currentCompany.pinCode && (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-5 h-5 text-violet-600" />
                    <p className="text-sm text-slate-500 font-medium">Pin Code</p>
                  </div>
                  <p className="text-slate-800">{currentCompany.pinCode}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Companies List Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-3 rounded-xl">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">All Companies</h2>
            </div>
            <div className="bg-blue-100 text-blue-800 px-5 py-2 rounded-full font-bold text-lg">
              {companies.length}
            </div>
          </div>

          {loading && companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-slate-600">Loading companies from Tally...</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-20 h-20 mx-auto mb-4 text-slate-300" />
              <p className="text-xl text-slate-600 mb-2">No companies found</p>
              <p className="text-sm text-slate-500">Make sure Tally is running with ODBC enabled</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {companies.map((company, index) => {
                const isActive = currentCompany && currentCompany.name === company.name;
                
                return (
                  <div
                    key={company.guid || index}
                    className={`relative border-2 rounded-xl p-5 transition-all hover:shadow-lg ${
                      isActive
                        ? 'border-green-400 bg-green-50 shadow-md'
                        : 'border-slate-200 bg-slate-50 hover:border-blue-300'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute -top-3 -right-3 bg-green-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        ACTIVE
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-2.5 rounded-lg ${isActive ? 'bg-green-600' : 'bg-blue-600'}`}>
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-slate-800 mb-3 text-lg leading-tight">
                      {company.name || 'Unnamed Company'}
                    </h3>
                    
                    <div className="space-y-2.5 text-sm">
                      {company.companyNumber && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Hash className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">No:</span>
                          <span className="text-slate-800">{company.companyNumber}</span>
                        </div>
                      )}
                      
                      {company.booksFrom && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4 text-purple-500" />
                          <span className="font-medium">Books:</span>
                          <span className="text-slate-800">{formatDate(company.booksFrom)}</span>
                        </div>
                      )}
                      
                      {company.startingFrom && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4 text-indigo-500" />
                          <span className="font-medium">Started:</span>
                          <span className="text-slate-800">{formatDate(company.startingFrom)}</span>
                        </div>
                      )}

                      {company.email && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="w-4 h-4 text-orange-500" />
                          <span className="text-slate-800 truncate">{company.email}</span>
                        </div>
                      )}

                      {company.phone && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-4 h-4 text-teal-500" />
                          <span className="text-slate-800">{company.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-slate-500">
          <p>Connected to Tally on localhost:9000</p>
        </div>
      </div>
    </div>
  );
}