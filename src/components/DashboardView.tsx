import React from 'react';
import { Box, Users, AlertTriangle, Clock, ArrowUpRight, ArrowRight, ShieldCheck } from 'lucide-react';
import { Product, Supplier, StockOrder, ActiveTab } from '../types';

interface DashboardViewProps {
  products: Product[];
  suppliers: Supplier[];
  orders: StockOrder[];
  minSafetyStock: number;
  setActiveTab: (tab: ActiveTab) => void;
  onNavigateToLowStock: () => void;
}

export default function DashboardView({
  products,
  suppliers,
  orders,
  minSafetyStock,
  setActiveTab,
  onNavigateToLowStock
}: DashboardViewProps) {
  // Metric 1: Total Products
  const totalProducts = products.length;

  // Metric 2: Total Suppliers
  const totalSuppliers = suppliers.length;

  // Metric 3: Low Stock Products (Stock_Quantity < minSafetyStock)
  const lowStockProducts = products.filter(p => p.Stock_Quantity < minSafetyStock);
  const lowStockCount = lowStockProducts.length;

  // Metric 4: Pending Orders
  const pendingOrders = orders.filter(o => o.Delivery_Status === 'Pending');
  const pendingCount = pendingOrders.length;

  // Recent Stock Orders (Latest 5, descending order by Order_ID or date)
  const recentOrders = [...orders]
    .sort((a, b) => b.Order_ID - a.Order_ID)
    .slice(0, 5);

  // Latest Products (Latest 5, descending order by Product_ID)
  const latestProducts = [...products]
    .sort((a, b) => b.Product_ID - a.Product_ID)
    .slice(0, 5);

  // Get product name for orders
  const getProductName = (productId: number) => {
    const p = products.find(prod => prod.Product_ID === productId);
    return p ? p.Product_Name : `Product #${productId}`;
  };

  // Get supplier name for products
  const getSupplierName = (supplierId: number) => {
    const s = suppliers.find(sup => sup.Supplier_ID === supplierId);
    return s ? s.Supplier_Name : `Supplier #${supplierId}`;
  };

  // Status pill colors
  const getStatusPill = (status: string) => {
    switch (status) {
      case 'Pending':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">Pending</span>;
      case 'Ordered':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">Ordered</span>;
      case 'Delivered':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Delivered</span>;
      case 'Cancelled':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-50 text-slate-500 border border-slate-200">Cancelled</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Dashboard</h2>
          <p className="text-sm text-slate-500">Real-time database metrics, inventory stats, and core business logs.</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-xl font-medium">
          <ShieldCheck className="w-4 h-4" />
          DBMS Project Schema: 3 Related Tables
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Products */}
        <div 
          onClick={() => setActiveTab('products')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-400 cursor-pointer shadow-xs hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Box className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold text-slate-400 tracking-wider block uppercase">Total Products</span>
            <span className="text-3xl font-bold text-slate-800 mt-1 block">{totalProducts}</span>
          </div>
        </div>

        {/* Total Suppliers */}
        <div 
          onClick={() => setActiveTab('suppliers')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-400 cursor-pointer shadow-xs hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold text-slate-400 tracking-wider block uppercase">Total Suppliers</span>
            <span className="text-3xl font-bold text-slate-800 mt-1 block">{totalSuppliers}</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div 
          onClick={onNavigateToLowStock}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-rose-400 cursor-pointer shadow-xs hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className={`p-3 rounded-xl transition-colors ${lowStockCount > 0 ? 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-rose-500 transition-colors" />
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold text-slate-400 tracking-wider block uppercase">Low Stock Products</span>
            <span className={`text-3xl font-bold mt-1 block ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{lowStockCount}</span>
          </div>
        </div>

        {/* Pending Orders */}
        <div 
          onClick={() => setActiveTab('orders')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-400 cursor-pointer shadow-xs hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className={`p-3 rounded-xl transition-colors ${pendingCount > 0 ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white' : 'bg-slate-50 text-slate-400'}`}>
              <Clock className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold text-slate-400 tracking-wider block uppercase">Pending Orders</span>
            <span className={`text-3xl font-bold mt-1 block ${pendingCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>{pendingCount}</span>
          </div>
        </div>
      </div>

      {/* Main Contents (split screen) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Recent Stock Orders */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Stock Orders</h3>
              <p className="text-xs text-slate-500">Latest active and historical replenishment orders</p>
            </div>
            <button
              onClick={() => setActiveTab('orders')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  <th className="py-3 px-5">ID</th>
                  <th className="py-3 px-5">Product</th>
                  <th className="py-3 px-5 text-right">Quantity</th>
                  <th className="py-3 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                      No stock orders logged yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.Order_ID} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-xs text-slate-500">#{order.Order_ID}</td>
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-800 line-clamp-1">
                          {getProductName(order.Product_ID)}
                        </div>
                        <div className="text-[10px] text-slate-400">{order.Order_Date}</div>
                      </td>
                      <td className="py-3.5 px-5 text-right font-semibold text-slate-700">
                        {order.Quantity_Ordered}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        {getStatusPill(order.Delivery_Status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Latest Products Added */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Latest Products Added</h3>
              <p className="text-xs text-slate-500">Most recent entries to the catalog</p>
            </div>
            <button
              onClick={() => setActiveTab('products')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer"
            >
              View Catalog <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  <th className="py-3 px-5">Product Name</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5 text-right">Unit Price</th>
                  <th className="py-3 px-5 text-right">In Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {latestProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                      No products added yet.
                    </td>
                  </tr>
                ) : (
                  latestProducts.map((product) => (
                    <tr key={product.Product_ID} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-800 line-clamp-1">{product.Product_Name}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">
                          Supplier: {getSupplierName(product.Supplier_ID)}
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-md">
                          {product.Category}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono text-slate-600 font-medium">
                        ${product.Unit_Price.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <span className={`font-semibold text-xs ${product.Stock_Quantity < minSafetyStock ? 'text-rose-600' : 'text-slate-700'}`}>
                          {product.Stock_Quantity} units
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* SQL Trace Banner for Students */}
      <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
            <h4 className="text-sm font-semibold tracking-wide uppercase text-slate-300">SQL Log Console Active</h4>
          </div>
          <p className="text-xs text-slate-400">
            Every screen action translates instantly to a relational SQL equivalent. Click the SQL Console to test queries, look up schemas, or trace logs.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('sql-console')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-blue-400 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          Open SQL Console <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
