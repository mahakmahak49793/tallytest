// app/dashboard/page.tsx
"use client";

import { ArrowRight, Building, Calendar, Calendar as CalendarIcon, Clock, FileText, Mail, MapPin, Phone, Plus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Company {
  guid: string;
  name: string;
  companyNumber: string;
  startingFrom: string;
  booksFrom: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  currentPeriod: string;
  currentDate: string;
  isActive: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/companies');
      const data = await response.json();
      
      if (data.success) {
        setCompanies(data.data);
      } else {
        setError(data.error || 'Failed to fetch companies');
      }
    } catch (err) {
      setError('Failed to connect to Tally server');
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const quickActions = [
    {
      title: 'View Ledgers',
      description: 'Explore company ledgers and accounts',
      icon: Users,
      route: '/dashboard/Ledgers',
      color: 'green'
    },
    {
      title: 'View Vouchers',
      description: 'Check all vouchers and transactions',
      icon: FileText,
      route: '/dashboard/Vouchers',
      color: 'purple'
    },
    {
      title: 'Create Voucher',
      description: 'Add new voucher to Tally',
      icon: Plus,
      route: '/dashboard/CreateVoucher',
      color: 'orange'
    },
     {
      title: 'View Customers',
      description: 'View Customers',
      icon: Users,
      route: '/dashboard/customers',
      color: 'orange'
    },
  ];

  // const formatDate = (dateString: string) => {
  //   if (!dateString) return 'N/A';
  //   try {
  //     const date = new Date(dateString);
  //     if (isNaN(date.getTime())) {
  //       return dateString;
  //     }
  //     return date.toLocaleDateString('en-IN', {
  //       day: '2-digit',
  //       month: 'short',
  //       year: 'numeric'
  //     });
  //   } catch {
  //     return dateString;
  //   }
  // };

 const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
    // Handle YYYYMMDD format (e.g., "20250401")
    if (/^\d{8}$/.test(dateString)) {
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      
      const date = new Date(`${year}-${month}-${day}`);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      const formattedDay = date.getDate().toString().padStart(2, '0');
      const formattedMonth = date.toLocaleDateString('en-IN', { month: 'short' }).toLowerCase();
      const formattedYear = date.getFullYear();
      
      return `${formattedDay}-${formattedMonth}-${formattedYear}`;
    }
    
    // Handle other date formats
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString('en-IN', { month: 'short' }).toLowerCase();
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch {
    return dateString;
  }
};

  const formatPeriod = (periodString: string) => {
    if (!periodString) return 'N/A';
    return periodString;
  };

  const getGridClass = () => {
    const count = companies.length;
    if (count === 0) return 'grid-cols-1';
    if (count === 1) return 'grid-cols-1 ';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  };

  // const activeCompany = companies.find(company => company.isActive);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
            <p className="text-gray-600 mt-2">
              Overview and quick access to your Tally data management
            </p>
          </div>
          {/* <button
            onClick={fetchCompanies}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button> */}
        </div>

      </div>

      {/* Companies Section */}
      <div className="mb-8">
     

        {loading ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
            <div className="animate-pulse">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Loading companies...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="text-center">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Unable to fetch companies
              </h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchCompanies}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : companies.length === 0 ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No Companies Found
            </h3>
            <p className="text-gray-600">
              No companies were found in your Tally data. Please check your Tally configuration.
            </p>
          </div>
        ) : (
          <div className={`grid ${getGridClass()} gap-6`}>
            {companies.map((company, index) => (
              <div
                key={company.guid || index}
                className={`bg-white rounded-lg shadow-lg border-2 transition-all duration-300 ${
                  company.isActive 
                    ? 'border-green-500 shadow-green-100' 
                    : 'border-gray-200 hover:shadow-xl'
                } ${companies.length === 1 ? 'max-w-4xl' : ''}`}
              >
                <div className="p-6">
                  {/* Company Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 ">
                      <div className={`p-2 rounded-lg ${
                        company.isActive 
                          ? 'bg-linear-to-r from-green-500 to-green-600' 
                          : 'bg-linear-to-r from-blue-500 to-blue-600'
                      } text-white`}>
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">
                            {company.name}
                          </h3>
                          {company.isActive && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium">
                              Active
                            </span>
                          )}
                        </div>
                        {company.companyNumber && (
                          <p className="text-sm text-gray-600">
                            Company No: {company.companyNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Current Period and Date */}
                {(company.currentPeriod || company.currentDate) && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="grid grid-cols-1 gap-2">
                        {company.currentPeriod && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-blue-800">Current Period:</span>
                            <span className="text-blue-700">{formatPeriod(company.currentPeriod)}</span>
                          </div>
                        )}
                        {company.currentDate && (
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarIcon className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-green-800">Current Date:</span>
                            <span className="text-green-700">{formatDate(company.currentDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Company Details */}
                  <div className="space-y-3">
                    {/* Dates */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      {company.startingFrom && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Start: {formatDate(company.startingFrom)}</span>
                        </div>
                      )}
                      {company.booksFrom && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Books: {formatDate(company.booksFrom)}</span>
                        </div>
                      )}
                    </div>

                    {/* Address */}
                    {company.address && (
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{company.address}</span>
                      </div>
                    )}

                    {/* Contact Info */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      {company.email && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{company.email}</span>
                        </div>
                      )}
                      {company.phone && (
                        <div className="flex items-center gap-1 text-green-600">
                          <Phone className="w-4 h-4" />
                          <span>{company.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

     
      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const colorClasses = {
            green: 'from-green-500 to-green-600',
            purple: 'from-purple-500 to-purple-600',
            orange: 'from-orange-500 to-orange-600',
          };

          return (
            <div
              key={action.title}
              className="bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer group"
              onClick={() => router.push(action.route)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg bg-linear-to-r ${colorClasses[action.color as keyof typeof colorClasses]} text-white group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 group-hover:text-gray-900">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-800">Vouchers Management</p>
                <p className="text-xs text-gray-600">View and manage all transactions</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-800">Ledgers Overview</p>
                <p className="text-xs text-gray-600">Browse company accounts and ledgers</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Plus className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-800">Create Transactions</p>
                <p className="text-xs text-gray-600">Add new vouchers to Tally</p>
              </div>
            </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-800">Customers</p>
                <p className="text-xs text-gray-600">Browse Companies</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Access</h3>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard/Vouchers')}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <p className="font-medium text-gray-800">View All Vouchers</p>
              <p className="text-sm text-gray-600">Browse complete transaction history</p>
            </button>
            <button
              onClick={() => router.push('/dashboard/CreateVoucher')}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <p className="font-medium text-gray-800">Create New Voucher</p>
              <p className="text-sm text-gray-600">Add transaction to Tally</p>
            </button>
            <button
              onClick={() => router.push('/dashboard/Ledgers')}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <p className="font-medium text-gray-800">Manage Ledgers</p>
              <p className="text-sm text-gray-600">View and search accounts</p>
            </button>

             <button
              onClick={() => router.push('/dashboard/customers')}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <p className="font-medium text-gray-800">Manage Customers</p>
              <p className="text-sm text-gray-600">View Customers</p>
            </button>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Connection Status</h3>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${loading ? 'bg-yellow-400' : error ? 'bg-red-400' : 'bg-green-400'}`}></div>
          <div>
            <p className="text-sm font-medium text-gray-800">
              {loading ? 'Connecting to Tally...' : 
               error ? 'Disconnected from Tally' : 
               'Connected to Tally'}
            </p>
            <p className="text-xs text-gray-600">
              {loading ? 'Establishing connection to localhost:9000' : 
               error ? error : 
               `Connected to ${companies.length} company${companies.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}