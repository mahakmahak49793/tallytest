// app/dashboard/page.tsx
"use client";

import { useRouter } from 'next/navigation';
import { Building, Users, FileText, Plus, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  const quickActions = [
    // {
    //   title: 'View Companies',
    //   description: 'Browse all companies in Tally',
    //   icon: Building,
    //   route: '/dashboard/tally-test',
    //   color: 'blue'
    // },
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
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-600 mt-2">
          Overview and quick access to your Tally data management
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const colorClasses = {
            blue: 'from-blue-500 to-blue-600',
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
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${colorClasses[action.color as keyof typeof colorClasses]} text-white group-hover:scale-110 transition-transform duration-300`}>
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
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-6 bg-white rounded-lg shadow">
          <FileText className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <h4 className="font-semibold text-gray-800">Voucher Management</h4>
          <p className="text-sm text-gray-600 mt-2">
            Complete control over all your transactions and vouchers
          </p>
        </div>
        <div className="text-center p-6 bg-white rounded-lg shadow">
          <Users className="w-8 h-8 text-green-600 mx-auto mb-3" />
          <h4 className="font-semibold text-gray-800">Ledger Access</h4>
          <p className="text-sm text-gray-600 mt-2">
            Real-time access to all company ledgers and accounts
          </p>
        </div>
        <div className="text-center p-6 bg-white rounded-lg shadow">
          <Building className="w-8 h-8 text-purple-600 mx-auto mb-3" />
          <h4 className="font-semibold text-gray-800">Multi-Company</h4>
          <p className="text-sm text-gray-600 mt-2">
            Support for multiple Tally companies and organizations
          </p>
        </div>
      </div>
    </div>
  );
}