import React, { useState } from 'react';
import { FileSpreadsheet, Printer, Download, Box, Users, AlertTriangle, ShoppingCart, TrendingUp } from 'lucide-react';
import { Product, Supplier, StockOrder } from '../types';

interface ReportsViewProps {
  products: Product[];
  suppliers: Supplier[];
  orders: StockOrder[];
  minSafetyStock: number;
}

type ReportType = 'low-stock' | 'suppliers' | 'inventory' | 'orders';

export default function ReportsView({
  products,
  suppliers,
  orders,
  minSafetyStock
}: ReportsViewProps) {
  const [activeReport, setActiveReport] = useState<ReportType>('low-stock');

  // Helpers
  const getSupplierName = (supplierId: number) => {
    const s = suppliers.find(sup => sup.Supplier_ID === supplierId);
    return s ? s.Supplier_Name : `Supplier #${supplierId}`;
  };

  const getProductName = (productId: number) => {
    const p = products.find(prod => prod.Product_ID === productId);
    return p ? p.Product_Name : `Product #${productId}`;
  };

  // --- REPORT GENERATION LOGIC ---

  // 1. Low Stock Report
  const lowStockData = products.filter(p => p.Stock_Quantity < minSafetyStock);

  // 2. Supplier List (enriched with metrics)
  const suppliersReportData = suppliers.map(s => {
    const supplierProducts = products.filter(p => p.Supplier_ID === s.Supplier_ID);
    const totalInventoryValue = supplierProducts.reduce((sum, p) => sum + (p.Unit_Price * p.Stock_Quantity), 0);
    return {
      ...s,
      productCount: supplierProducts.length,
      inventoryValuation: totalInventoryValue
    };
  });

  // 3. Full Product Inventory Report (with total valuation)
  const productInventoryData = products.map(p => ({
    ...p,
    totalValuation: p.Unit_Price * p.Stock_Quantity,
    supplierName: getSupplierName(p.Supplier_ID)
  }));
  const overallInventoryValuation = productInventoryData.reduce((sum, p) => sum + p.totalValuation, 0);
  const overallTotalItems = productInventoryData.reduce((sum, p) => sum + p.Stock_Quantity, 0);

  // 4. Stock Orders Report (enriched with product names)
  const stockOrdersReportData = orders.map(o => ({
    ...o,
    productName: getProductName(o.Product_ID),
    totalEstCost: (products.find(p => p.Product_ID === o.Product_ID)?.Unit_Price || 0) * o.Quantity_Ordered
  }));

  // --- CSV EXPORT TRIGGER ---
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = 'report.csv';

    if (activeReport === 'low-stock') {
      filename = `low_stock_report_(${minSafetyStock}_threshold).csv`;
      headers = ['Product ID', 'Product Name', 'Category', 'Current Stock', 'Safety Threshold', 'Supplier Name'];
      rows = lowStockData.map(p => [
        p.Product_ID.toString(),
        p.Product_Name,
        p.Category,
        p.Stock_Quantity.toString(),
        minSafetyStock.toString(),
        getSupplierName(p.Supplier_ID)
      ]);
    } else if (activeReport === 'suppliers') {
      filename = 'suppliers_list_report.csv';
      headers = ['Supplier ID', 'Supplier Name', 'Contact Person', 'City', 'Assigned Products', 'Total Stock Valuation ($)'];
      rows = suppliersReportData.map(s => [
        s.Supplier_ID.toString(),
        s.Supplier_Name,
        s.Contact_Person,
        s.City,
        s.productCount.toString(),
        s.inventoryValuation.toFixed(2)
      ]);
    } else if (activeReport === 'inventory') {
      filename = 'product_inventory_valuation_report.csv';
      headers = ['Product ID', 'Product Name', 'Category', 'Unit Price ($)', 'Stock Quantity', 'Stock Valuation ($)', 'Supplier Name'];
      rows = productInventoryData.map(p => [
        p.Product_ID.toString(),
        p.Product_Name,
        p.Category,
        p.Unit_Price.toFixed(2),
        p.Stock_Quantity.toString(),
        p.totalValuation.toFixed(2),
        p.supplierName
      ]);
    } else if (activeReport === 'orders') {
      filename = 'stock_replenishment_orders_report.csv';
      headers = ['Order ID', 'Product ID', 'Product Name', 'Quantity Ordered', 'Estimated Cost ($)', 'Order Date', 'Delivery Status'];
      rows = stockOrdersReportData.map(o => [
        o.Order_ID.toString(),
        o.Product_ID.toString(),
        o.productName,
        o.Quantity_Ordered.toString(),
        o.totalEstCost.toFixed(2),
        o.Order_Date,
        o.Delivery_Status
      ]);
    }

    // Convert to CSV string with escapes
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Download Blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- PRINT / PDF REPORT TRIGER ---
  const handlePrintPDF = () => {
    const printContent = document.getElementById('report-print-area');
    if (!printContent) return;

    const originalContents = document.body.innerHTML;
    const printWindowHTML = `
      <html>
        <head>
          <title>Inventory DBMS Report Output</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 40px; }
            h1 { font-size: 24px; font-weight: bold; margin-bottom: 5px; color: #0f172a; }
            p { font-size: 14px; color: #64748b; margin-top: 0; margin-bottom: 25px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
            th { background-color: #f1f5f9; font-weight: bold; color: #475569; text-transform: uppercase; font-size: 11px; tracking: 0.05em; }
            tr:hover { background-color: #f8fafc; }
            .badge { display: inline-block; padding: 3px 8px; font-size: 11px; font-weight: bold; border-radius: 9999px; }
            .badge-warn { background-color: #fef2f2; color: #991b1b; border: 1px solid #fee2e2; }
            .badge-success { background-color: #ecfdf5; color: #065f46; border: 1px solid #d1fae5; }
            .badge-info { background-color: #eff6ff; color: #1e40af; border: 1px solid #dbeafe; }
            .text-right { text-align: right; }
            .font-mono { font-family: monospace; }
            .totals { margin-top: 30px; background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px; }
            .totals-grid { display: grid; grid-template-cols: repeat(2, 1fr); gap: 15px; }
          </style>
        </head>
        <body>
          <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px;">
            <span style="font-size: 11px; font-weight: bold; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.1em;">Inventory Control DBMS</span>
            <h1>${
              activeReport === 'low-stock' ? 'Safety Low Stock Report' :
              activeReport === 'suppliers' ? 'Corporate Suppliers Report' :
              activeReport === 'inventory' ? 'Inventory Valuation & Audit Report' :
              'Stock Replenishment Orders Report'
            }</h1>
            <p>Generated on ${new Date().toLocaleString()} | DB Status: Consistent</p>
          </div>
          ${printContent.innerHTML}
          <div style="margin-top: 50px; border-top: 1px solid #cbd5e1; padding-top: 15px; text-align: center; font-size: 11px; color: #94a3b8;">
            Inventory Control DBMS • College DBMS Academic Project Output
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    // Open a new printable window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printWindowHTML);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Reports</h2>
          <p className="text-sm text-slate-500">Generate analytical exports, stock valuations, and audit logs.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
          </button>
          
          {/* Print PDF */}
          <button
            onClick={handlePrintPDF}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Save as PDF / Print
          </button>
        </div>
      </div>

      {/* Reports Navigation Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <button
          onClick={() => setActiveReport('low-stock')}
          className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            activeReport === 'low-stock'
              ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold shadow-xs'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className={`w-4 h-4 ${activeReport === 'low-stock' ? 'text-blue-600' : 'text-slate-400'}`} />
          <div className="text-xs">
            <div className="font-semibold">Low Stock</div>
            <span className="text-[10px] text-slate-400 font-normal">Below safety stock</span>
          </div>
        </button>

        <button
          onClick={() => setActiveReport('suppliers')}
          className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            activeReport === 'suppliers'
              ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold shadow-xs'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Users className={`w-4 h-4 ${activeReport === 'suppliers' ? 'text-blue-600' : 'text-slate-400'}`} />
          <div className="text-xs">
            <div className="font-semibold">Suppliers</div>
            <span className="text-[10px] text-slate-400 font-normal">Contact & valuation</span>
          </div>
        </button>

        <button
          onClick={() => setActiveReport('inventory')}
          className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            activeReport === 'inventory'
              ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold shadow-xs'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Box className={`w-4 h-4 ${activeReport === 'inventory' ? 'text-blue-600' : 'text-slate-400'}`} />
          <div className="text-xs">
            <div className="font-semibold">Product Catalog</div>
            <span className="text-[10px] text-slate-400 font-normal">Full valuations</span>
          </div>
        </button>

        <button
          onClick={() => setActiveReport('orders')}
          className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            activeReport === 'orders'
              ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold shadow-xs'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ShoppingCart className={`w-4 h-4 ${activeReport === 'orders' ? 'text-blue-600' : 'text-slate-400'}`} />
          <div className="text-xs">
            <div className="font-semibold">Stock Orders</div>
            <span className="text-[10px] text-slate-400 font-normal">Shipping & statuses</span>
          </div>
        </button>
      </div>

      {/* Report Canvas Frame */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Print-area wrapper */}
        <div id="report-print-area" className="p-6 space-y-6">
          
          {/* 1. LOW STOCK REPORT */}
          {activeReport === 'low-stock' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-md font-bold text-slate-900">Safety Stock Low Alert Report</h3>
                  <p className="text-xs text-slate-500">Displays products whose current stock levels reside below the specified threshold ({minSafetyStock} items).</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-400 block">Flagged Items</span>
                  <span className="text-lg font-bold text-rose-600">{lowStockData.length} items</span>
                </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-3 px-4">Product ID</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">In Stock</th>
                    <th className="py-3 px-4 text-right">Threshold</th>
                    <th className="py-3 px-4">Supplier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {lowStockData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        No products are currently under the {minSafetyStock} safety stock threshold.
                      </td>
                    </tr>
                  ) : (
                    lowStockData.map(p => (
                      <tr key={p.Product_ID} className="hover:bg-slate-50/20">
                        <td className="py-3 px-4 font-mono text-xs text-slate-400">#{p.Product_ID}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{p.Product_Name}</td>
                        <td className="py-3 px-4 text-slate-500">{p.Category}</td>
                        <td className="py-3 px-4 text-right font-bold text-rose-600 font-mono">{p.Stock_Quantity}</td>
                        <td className="py-3 px-4 text-right text-slate-400 font-mono">{minSafetyStock}</td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{getSupplierName(p.Supplier_ID)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. SUPPLIER LIST */}
          {activeReport === 'suppliers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-md font-bold text-slate-900">Corporate Supplier Report</h3>
                  <p className="text-xs text-slate-500">Contact catalog of registered corporate entities and computed catalog valuations.</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-400 block">Total Suppliers</span>
                  <span className="text-lg font-bold text-blue-600">{suppliersReportData.length} partners</span>
                </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Supplier Name</th>
                    <th className="py-3 px-4">Contact Representative</th>
                    <th className="py-3 px-4">HQs City</th>
                    <th className="py-3 px-4 text-center">Catalog size</th>
                    <th className="py-3 px-4 text-right">Inventory Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {suppliersReportData.map(s => (
                    <tr key={s.Supplier_ID} className="hover:bg-slate-50/20">
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">#{s.Supplier_ID}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{s.Supplier_Name}</td>
                      <td className="py-3 px-4 text-slate-600">{s.Contact_Person}</td>
                      <td className="py-3 px-4 text-slate-500">{s.City}</td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-700">{s.productCount} items</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700 font-semibold">${s.inventoryValuation.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. PRODUCT INVENTORY */}
          {activeReport === 'inventory' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-md font-bold text-slate-900">Total Catalog Inventory & Stock Valuations</h3>
                  <p className="text-xs text-slate-500">Provides full catalog tracking, stock values (Unit Price × Stock) and relational mappings.</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-400 block">Total Database Valuation</span>
                  <span className="text-lg font-bold text-emerald-600">${overallInventoryValuation.toFixed(2)}</span>
                </div>
              </div>

              {/* Summary Stats block for Print */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Overall Registered Products</span>
                  <span className="text-xl font-bold text-slate-800">{productInventoryData.length} distinct items</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Stock Quantity Volume</span>
                  <span className="text-xl font-bold text-slate-800">{overallTotalItems} total units</span>
                </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-right">Stock</th>
                    <th className="py-3 px-4 text-right">Stock Valuation</th>
                    <th className="py-3 px-4">Supplier Partner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {productInventoryData.map(p => (
                    <tr key={p.Product_ID} className="hover:bg-slate-50/20">
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">#{p.Product_ID}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{p.Product_Name}</td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-sm text-slate-600 text-xs">{p.Category}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">${p.Unit_Price.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-semibold font-mono text-slate-800">{p.Stock_Quantity}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">${p.totalValuation.toFixed(2)}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{p.supplierName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. STOCK ORDERS REPORT */}
          {activeReport === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-md font-bold text-slate-900">Stock Replenishment Orders Report</h3>
                  <p className="text-xs text-slate-500">History log and statuses of shipping orders placed to vendors.</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-400 block">Total Orders Registered</span>
                  <span className="text-lg font-bold text-indigo-600">{orders.length} shipments</span>
                </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4 text-right">Qty Ordered</th>
                    <th className="py-3 px-4 text-right">Est. Cost</th>
                    <th className="py-3 px-4 text-center">Date</th>
                    <th className="py-3 px-4 text-center">Delivery Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {stockOrdersReportData.map(o => (
                    <tr key={o.Order_ID} className="hover:bg-slate-50/20">
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">#{o.Order_ID}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{o.productName}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">{o.Quantity_Ordered}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">${o.totalEstCost.toFixed(2)}</td>
                      <td className="py-3 px-4 text-center text-slate-500 text-xs">{o.Order_Date}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-xs">{o.Delivery_Status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
