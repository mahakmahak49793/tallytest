// app/dashboard/layout.tsx
"use client";

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Building, Users, FileText, Plus, Home, BarChart3 } from 'lucide-react';

type ViewType = 'dashboard' | 'companies' | 'ledgers' | 'vouchers' | 'create-voucher';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Home, path: '/dashboard' },
    // { id: 'companies', name: 'View Companies', icon: Building, path: '/dashboard/tally-test' },
    { id: 'ledgers', name: 'View Ledgers', icon: Users, path: '/dashboard/Ledgers' },
    { id: 'vouchers', name: 'View Vouchers', icon: FileText, path: '/dashboard/Vouchers' },
    { id: 'create-voucher', name: 'Create Voucher', icon: Plus, path: '/dashboard/CreateVoucher' },
  ];

  const getActiveView = (): ViewType => {
    const currentPath = pathname;
    if (currentPath === '/dashboard') return 'dashboard';
    if (currentPath.includes('/companies')) return 'companies';
    if (currentPath.includes('/ledgers')) return 'ledgers';
    if (currentPath.includes('/vouchers')) return 'vouchers';
    if (currentPath.includes('/create-voucher')) return 'create-voucher';
    return 'dashboard';
  };

  const activeView = getActiveView();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Fixed Sidebar */}
      <div className="w-64 bg-white shadow-lg fixed h-full overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Tally Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your Tally data</p>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => router.push(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main Content with sidebar offset */}
      <div className="flex-1 ml-64 overflow-auto">
        {children}
      </div>
    </div>
  );
}