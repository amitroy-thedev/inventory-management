import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, FilePlus2, ShoppingBag, X, Check, Eye, HelpCircle } from 'lucide-react';
import { StockOrder, Product, DeliveryStatus } from '../types';

interface OrdersViewProps {
  orders: StockOrder[];
  products: Product[];
  onAddOrder: (order: Omit<StockOrder, 'Order_ID'>) => void;
  onAddBulkOrders: (orders: Omit<StockOrder, 'Order_ID'>[]) => void;
  onEditOrder: (order: StockOrder) => void;
  onDeleteOrder: (id: number) => void;
  onLogSql: (query: string, description: string, affectedRows: number) => void;
}

export default function OrdersView({
  orders,
  products,
  onAddOrder,
  onAddBulkOrders,
  onEditOrder,
  onDeleteOrder,
  onLogSql
}: OrdersViewProps) {
  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [dateSearch, setDateSearch] = useState<string>('');

  // Bulk Ordering State
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkSelections, setBulkSelections] = useState<{ [productId: number]: { selected: boolean; quantity: number } }>({});
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  // Form State for Single Order
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<StockOrder | null>(null);
  const [formData, setFormData] = useState({
    Product_ID: '',
    Quantity_Ordered: '',
    Order_Date: new Date().toISOString().split('T')[0],
    Delivery_Status: 'Pending' as DeliveryStatus
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Helpers
  const getProductName = (productId: number) => {
    const p = products.find(prod => prod.Product_ID === productId);
    return p ? p.Product_Name : `Product #${productId}`;
  };

  const getProductCategory = (productId: number) => {
    const p = products.find(prod => prod.Product_ID === productId);
    return p ? p.Category : 'N/A';
  };

  // Filter orders
  const filteredOrders = orders.filter(o => {
    const matchesStatus = selectedStatus === 'All' || o.Delivery_Status === selectedStatus;
    const matchesDate = !dateSearch || o.Order_Date.includes(dateSearch);
    return matchesStatus && matchesDate;
  });

  // Open single order add
  const handleOpenAdd = () => {
    setEditingOrder(null);
    setFormData({
      Product_ID: products.length > 0 ? products[0].Product_ID.toString() : '',
      Quantity_Ordered: '',
      Order_Date: new Date().toISOString().split('T')[0],
      Delivery_Status: 'Pending'
    });
    setFormErrors([]);
    setIsFormOpen(true);
  };

  // Open single order edit
  const handleOpenEdit = (order: StockOrder) => {
    setEditingOrder(order);
    setFormData({
      Product_ID: order.Product_ID.toString(),
      Quantity_Ordered: order.Quantity_Ordered.toString(),
      Order_Date: order.Order_Date,
      Delivery_Status: order.Delivery_Status
    });
    setFormErrors([]);
    setIsFormOpen(true);
  };

  // Single Order Submit Validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    if (!formData.Product_ID) errors.push("Product selection is required");
    if (!formData.Delivery_Status) errors.push("Delivery Status is required");
    
    const qty = parseInt(formData.Quantity_Ordered, 10);
    if (isNaN(qty) || qty <= 0) {
      errors.push("Quantity Ordered must be greater than 0");
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    const prodId = parseInt(formData.Product_ID, 10);

    if (editingOrder) {
      // Edit
      const updated: StockOrder = {
        Order_ID: editingOrder.Order_ID,
        Product_ID: prodId,
        Quantity_Ordered: qty,
        Order_Date: formData.Order_Date,
        Delivery_Status: formData.Delivery_Status
      };
      onEditOrder(updated);

      // Log SQL
      const query = `UPDATE Stock_Orders 
SET Product_ID = ${updated.Product_ID}, 
    Quantity_Ordered = ${updated.Quantity_Ordered}, 
    Order_Date = '${updated.Order_Date}', 
    Delivery_Status = '${updated.Delivery_Status}' 
WHERE Order_ID = ${updated.Order_ID};`;
      onLogSql(query, `Updated stock order #${updated.Order_ID}`, 1);
    } else {
      // Add
      const newOrder = {
        Product_ID: prodId,
        Quantity_Ordered: qty,
        Order_Date: formData.Order_Date,
        Delivery_Status: formData.Delivery_Status
      };
      onAddOrder(newOrder);

      // Log SQL
      const query = `INSERT INTO Stock_Orders (Product_ID, Quantity_Ordered, Order_Date, Delivery_Status) 
VALUES (${prodId}, ${qty}, '${formData.Order_Date}', '${formData.Delivery_Status}');`;
      onLogSql(query, `Logged new stock order for: ${getProductName(prodId)}`, 1);
    }

    setIsFormOpen(false);
  };

  // Bulk mode checkbox toggle
  const handleBulkCheckboxToggle = (productId: number) => {
    setBulkSelections(prev => {
      const existing = prev[productId] || { selected: false, quantity: 10 };
      return {
        ...prev,
        [productId]: {
          selected: !existing.selected,
          quantity: existing.quantity
        }
      };
    });
  };

  // Bulk mode quantity change
  const handleBulkQuantityChange = (productId: number, qtyStr: string) => {
    const qty = parseInt(qtyStr, 10) || 0;
    setBulkSelections(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        quantity: qty
      }
    }));
  };

  // Execute Bulk Orders Submission
  const handleBulkSubmit = () => {
    const itemsToOrder = Object.keys(bulkSelections)
      .map(Number)
      .filter(productId => bulkSelections[productId]?.selected && bulkSelections[productId]?.quantity > 0)
      .map(productId => ({
        Product_ID: productId,
        Quantity_Ordered: bulkSelections[productId].quantity,
        Order_Date: new Date().toISOString().split('T')[0],
        Delivery_Status: 'Pending' as DeliveryStatus
      }));

    if (itemsToOrder.length === 0) {
      setBulkMessage("⚠️ Please select at least one product with an ordered quantity greater than 0.");
      setTimeout(() => setBulkMessage(null), 4000);
      return;
    }

    // Call state handler
    onAddBulkOrders(itemsToOrder);

    // SQL Tracing Log
    const insertStatements = itemsToOrder.map(item => 
      `INSERT INTO Stock_Orders (Product_ID, Quantity_Ordered, Order_Date, Delivery_Status) VALUES (${item.Product_ID}, ${item.Quantity_Ordered}, '${item.Order_Date}', 'Pending');`
    ).join('\n');

    const totalRows = itemsToOrder.length;
    onLogSql(
      `-- BULK INSERT TRANSACTION\nBEGIN TRANSACTION;\n${insertStatements}\nCOMMIT;`,
      `Created ${totalRows} stock orders via bulk submission`,
      totalRows
    );

    // Show Confirmation
    setBulkMessage(`✔ Successfully created ${totalRows} stock orders in one submission!`);
    
    // Reset selections
    setBulkSelections({});
    setIsBulkMode(false);
    setTimeout(() => setBulkMessage(null), 5000);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Ordered':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancelled':
        return 'bg-slate-50 text-slate-500 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Stock Orders</h2>
          <p className="text-sm text-slate-500">Replenish item catalogs, trigger bulk orders, and update shipping logs.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBulkMode(!isBulkMode)}
            className={`inline-flex items-center gap-2 font-semibold text-sm px-4 py-2.5 rounded-xl border shadow-xs transition-all cursor-pointer ${
              isBulkMode 
                ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <FilePlus2 className="w-4.5 h-4.5" /> {isBulkMode ? 'Show Orders List' : 'Bulk Order Mode'}
          </button>
          
          {!isBulkMode && (
            <button
              onClick={handleOpenAdd}
              disabled={products.length === 0}
              className={`inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer ${
                products.length === 0 ? 'opacity-50 cursor-not-allowed bg-slate-400' : ''
              }`}
              title={products.length === 0 ? "Add products first!" : ""}
            >
              <Plus className="w-4.5 h-4.5" /> Create Order
            </button>
          )}
        </div>
      </div>

      {products.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-semibold flex items-center gap-3">
          <ShoppingBag className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>DBMS Constraint Warning: You cannot place stock orders until at least one Product exists in the catalog database.</span>
        </div>
      )}

      {/* Bulk Message Confirmation Block */}
      {bulkMessage && (
        <div className={`p-4 rounded-xl border text-sm font-semibold transition-all ${
          bulkMessage.startsWith('✔') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          {bulkMessage}
        </div>
      )}

      {/* Bulk Stock Order Management Panel */}
      {isBulkMode ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Product Selection Table */}
          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-full inline-block mb-1.5 uppercase">
                DBMS Core Requirement #3
              </span>
              <h3 className="text-base font-bold text-slate-900">Bulk Stock Order Selection</h3>
              <p className="text-xs text-slate-500">Check multiple products and assign quantities to insert multiple orders at once.</p>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  <tr>
                    <th className="py-3 px-4 text-center w-12">Select</th>
                    <th className="py-3 px-4">Product details</th>
                    <th className="py-3 px-4 text-right">In Stock</th>
                    <th className="py-3 px-4 text-right w-32">Order Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(p => {
                    const sel = bulkSelections[p.Product_ID] || { selected: false, quantity: 10 };
                    return (
                      <tr 
                        key={p.Product_ID} 
                        className={`hover:bg-slate-50/40 transition-colors ${sel.selected ? 'bg-blue-50/15' : ''}`}
                      >
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={sel.selected}
                            onChange={() => handleBulkCheckboxToggle(p.Product_ID)}
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded-md focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{p.Product_Name}</div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">{p.Category}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-slate-600">
                          {p.Stock_Quantity} units
                        </td>
                        <td className="py-3 px-4 text-right">
                          <input
                            type="number"
                            min="1"
                            disabled={!sel.selected}
                            value={sel.selected ? sel.quantity : ''}
                            placeholder="Qty..."
                            onChange={(e) => handleBulkQuantityChange(p.Product_ID, e.target.value)}
                            className={`w-full bg-slate-50 border rounded-xl px-3 py-1.5 text-right text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                              sel.selected ? 'border-blue-200 text-slate-800 bg-white' : 'border-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => {
                  setBulkSelections({});
                  setIsBulkMode(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkSubmit}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Create Bulk Orders Submission
              </button>
            </div>
          </div>

          {/* Right Column: DBMS Tracing Preview */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm text-slate-100 space-y-4 h-full">
              <div>
                <h4 className="text-xs font-bold tracking-wider text-blue-400 uppercase">DBMS Transaction Tracing</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  How multiple insertions are committed atomically inside an SQL environment.
                </p>
              </div>

              {/* Dynamic SQL generation preview based on selections */}
              <div className="space-y-3">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Atomicity Query (Draft):</span>
                
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto min-h-40 max-h-64 overflow-y-auto">
                  <div>-- Dynamic SQL Transaction Block</div>
                  <div className="text-blue-400">BEGIN TRANSACTION;</div>
                  
                  {Object.keys(bulkSelections)
                    .map(Number)
                    .filter(pId => bulkSelections[pId]?.selected)
                    .map(pId => (
                      <div key={pId} className="text-emerald-400">
                        {`INSERT INTO Stock_Orders (Product_ID, Quantity_Ordered, Order_Date, Delivery_Status)\nVALUES (${pId}, ${bulkSelections[pId].quantity}, '${new Date().toISOString().split('T')[0]}', 'Pending');`}
                      </div>
                    ))}
                  
                  {Object.keys(bulkSelections).map(Number).filter(pId => bulkSelections[pId]?.selected).length === 0 && (
                    <div className="text-slate-500 italic mt-2">-- Check products on the left to draft insertion statements --</div>
                  )}

                  <div className="text-blue-400">COMMIT;</div>
                </div>

                <div className="text-xs text-slate-400 space-y-1.5 bg-slate-850 p-3.5 rounded-xl border border-slate-800 leading-normal">
                  <p className="font-semibold text-slate-200">Why use Bulk Transactions?</p>
                  <p className="text-[11px]">
                    1. <strong>Reduced IO Overhead:</strong> Combines multiple client requests into a single database commit.
                  </p>
                  <p className="text-[11px]">
                    2. <strong>All-or-Nothing Rule:</strong> Ensures database integrity. If one insertion fails, the entire block rollbacks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Standard Orders Table list */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          
          {/* Filter Bar Controls */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Orders Database ({filteredOrders.length} records)
            </span>

            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
              {/* Status Picker dropdown */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-medium whitespace-nowrap">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Ordered">Ordered</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Date Search Box */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Filter Date (YYYY-MM-DD)..."
                  value={dateSearch}
                  onChange={(e) => setDateSearch(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 placeholder-slate-400"
                />
                {dateSearch && (
                  <button
                    onClick={() => setDateSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/20 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  <th className="py-3 px-5">Order ID</th>
                  <th className="py-3 px-5">Product Details</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5 text-right">Quantity</th>
                  <th className="py-3 px-5 text-center">Date</th>
                  <th className="py-3 px-5 text-center">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      No matching orders found in the database.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.Order_ID} className="hover:bg-slate-50/40 transition-all">
                      <td className="py-3.5 px-5 font-mono text-xs text-slate-400">
                        #{order.Order_ID}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-slate-800">
                        {getProductName(order.Product_ID)}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-sm text-slate-600 font-medium">
                          {getProductCategory(order.Product_ID)}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-semibold text-slate-700 font-mono">
                        {order.Quantity_Ordered}
                      </td>
                      <td className="py-3.5 px-5 text-center text-slate-500 text-xs">
                        {order.Order_Date}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusStyle(order.Delivery_Status)}`}>
                          {order.Delivery_Status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(order)}
                            className="p-1.5 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                            title="Edit Order Status/Qty"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteOrder(order.Order_ID)}
                            className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete Order Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Single Order Creation / Editing Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsFormOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />
          
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingOrder ? `Edit Stock Order #${editingOrder.Order_ID}` : 'Insert Single Stock Order'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formErrors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 space-y-1">
                  {formErrors.map((error, idx) => (
                    <p key={idx} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      {error}
                    </p>
                  ))}
                </div>
              )}

              {/* Product selector Dropdown */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Product * (Relational FK)</label>
                <select
                  value={formData.Product_ID}
                  onChange={(e) => setFormData({ ...formData, Product_ID: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer"
                >
                  {products.map((p) => (
                    <option key={p.Product_ID} value={p.Product_ID}>
                      {p.Product_Name} (In Stock: {p.Stock_Quantity})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity Ordered */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Quantity Ordered *</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 15"
                  value={formData.Quantity_Ordered}
                  onChange={(e) => setFormData({ ...formData, Quantity_Ordered: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 placeholder-slate-400"
                />
              </div>

              {/* Order Date */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Order Date *</label>
                <input
                  type="date"
                  value={formData.Order_Date}
                  onChange={(e) => setFormData({ ...formData, Order_Date: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                />
              </div>

              {/* Delivery Status Option picker */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Delivery Status *</label>
                <select
                  value={formData.Delivery_Status}
                  onChange={(e) => setFormData({ ...formData, Delivery_Status: e.target.value as DeliveryStatus })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="Ordered">Ordered</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {editingOrder ? 'Save Changes' : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
