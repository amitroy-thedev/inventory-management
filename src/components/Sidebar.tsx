import React, { useState } from 'react';
import { LayoutDashboard, Users, Box, ShoppingCart, BarChart3, Database, Menu, X } from 'lucide-react';
import { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  sqlLogsCount: number;
}

export default function Sidebar({ activeTab, setActiveTab, sqlLogsCount }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard' as ActiveTab, name: 'Dashboard', icon: LayoutDashboard, description: 'Overview & quick metrics' },
    { id: 'suppliers' as ActiveTab, name: 'Suppliers', icon: Users, description: 'Supplier directories & city queries' },
    { id: 'products' as ActiveTab, name: 'Products', icon: Box, description: 'Product listings & stock safety' },
    { id: 'orders' as ActiveTab, name: 'Stock Orders', icon: ShoppingCart, description: 'Purchase orders & bulk operations' },
    { id: 'reports' as ActiveTab, name: 'Reports', icon: BarChart3, description: 'Data export & printable metrics' },
    { id: 'sql-console' as ActiveTab, name: 'SQL Console', icon: Database, description: 'Interactive SQL & DBMS tracing', count: sqlLogsCount }
  ];

  const handleTabClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header Banner */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded-lg text-white">
            <Database className="w-5 h-5" />
          </div>
          <span className="font-semibold text-slate-800 tracking-tight text-sm">Inventory DBMS</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
          aria-label="Toggle Navigation"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-white border-r border-slate-200 shadow-xs transform lg:transform-none transition-transform duration-200 ease-in-out lg:sticky lg:top-0 lg:h-screen ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header (Desktop) */}
        <div className="hidden lg:flex items-center gap-3 px-6 py-6 border-b border-slate-100">
          <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-200">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 leading-tight text-md">Inventory DBMS</h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide">COLLEGE DATABASE PROJECT</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-left transition-all duration-150 group cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm leading-none">{item.name}</div>
                  <span className={`text-[10px] leading-none ${isActive ? 'text-blue-500' : 'text-slate-400 font-normal group-hover:text-slate-500'}`}>
                    {item.description}
                  </span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-blue-200 text-blue-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User / Database Status Card */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 m-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                DB
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">Offline-First CRUD</p>
              <p className="text-[10px] text-slate-400">LocalStorage Active</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-xs lg:hidden"
        />
      )}
    </>
  );
}
