import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, DollarSign, Box, ShieldAlert, X, Filter, BarChart2 } from 'lucide-react';
import { Product, Supplier } from '../types';

interface ProductsViewProps {
  products: Product[];
  suppliers: Supplier[];
  minSafetyStock: number;
  setMinSafetyStock: (stock: number) => void;
  onAddProduct: (product: Omit<Product, 'Product_ID'>) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
  onLogSql: (query: string, description: string, affectedRows: number) => void;
  showLowStockTrigger: boolean;
}

export default function ProductsView({
  products,
  suppliers,
  minSafetyStock,
  setMinSafetyStock,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onLogSql,
  showLowStockTrigger
}: ProductsViewProps) {
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Form Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    Product_Name: '',
    Category: '',
    Unit_Price: '',
    Stock_Quantity: '',
    Supplier_ID: ''
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Categories
  const categories = Array.from(new Set(products.map(p => p.Category)));

  // Filter products for the primary catalog table
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.Product_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.Category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || p.Category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // DBMS Specific Feature 1: Low Stock Products calculation
  const lowStockProducts = products.filter(p => p.Stock_Quantity < minSafetyStock);

  // Helper to get supplier name
  const getSupplierName = (supplierId: number) => {
    const s = suppliers.find(sup => sup.Supplier_ID === supplierId);
    return s ? s.Supplier_Name : `Supplier #${supplierId}`;
  };

  // Open add modal
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      Product_Name: '',
      Category: '',
      Unit_Price: '',
      Stock_Quantity: '',
      Supplier_ID: suppliers.length > 0 ? suppliers[0].Supplier_ID.toString() : ''
    });
    setFormErrors([]);
    setIsFormOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      Product_Name: product.Product_Name,
      Category: product.Category,
      Unit_Price: product.Unit_Price.toString(),
      Stock_Quantity: product.Stock_Quantity.toString(),
      Supplier_ID: product.Supplier_ID.toString()
    });
    setFormErrors([]);
    setIsFormOpen(true);
  };

  // Form submission & validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    // Fields required checks
    if (!formData.Product_Name.trim()) errors.push("Product Name is required");
    if (!formData.Category.trim()) errors.push("Category is required");
    if (!formData.Supplier_ID) errors.push("Supplier is required");

    // Number conversions
    const price = parseFloat(formData.Unit_Price);
    const stock = parseInt(formData.Stock_Quantity, 10);

    // Validation checks
    if (isNaN(price) || price <= 0) {
      errors.push("Unit Price must be positive (greater than 0)");
    }
    if (isNaN(stock) || stock < 0) {
      errors.push("Stock Quantity cannot be negative");
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    const supplierId = parseInt(formData.Supplier_ID, 10);

    if (editingProduct) {
      // Edit mode
      const updatedProduct: Product = {
        Product_ID: editingProduct.Product_ID,
        Product_Name: formData.Product_Name.trim(),
        Category: formData.Category.trim(),
        Unit_Price: price,
        Stock_Quantity: stock,
        Supplier_ID: supplierId
      };
      onEditProduct(updatedProduct);

      // Log SQL query trace
      const sqlQuery = `UPDATE Products 
SET Product_Name = '${updatedProduct.Product_Name.replace(/'/g, "''")}', 
    Category = '${updatedProduct.Category.replace(/'/g, "''")}', 
    Unit_Price = ${updatedProduct.Unit_Price}, 
    Stock_Quantity = ${updatedProduct.Stock_Quantity}, 
    Supplier_ID = ${updatedProduct.Supplier_ID} 
WHERE Product_ID = ${updatedProduct.Product_ID};`;
      onLogSql(sqlQuery, `Updated product catalog record: ${updatedProduct.Product_Name}`, 1);
    } else {
      // Create mode
      onAddProduct({
        Product_Name: formData.Product_Name.trim(),
        Category: formData.Category.trim(),
        Unit_Price: price,
        Stock_Quantity: stock,
        Supplier_ID: supplierId
      });

      // Log SQL query trace
      const sqlQuery = `INSERT INTO Products (Product_Name, Category, Unit_Price, Stock_Quantity, Supplier_ID) 
VALUES ('${formData.Product_Name.replace(/'/g, "''")}', '${formData.Category.replace(/'/g, "''")}', ${price}, ${stock}, ${supplierId});`;
      onLogSql(sqlQuery, `Created product catalog record: ${formData.Product_Name}`, 1);
    }

    setIsFormOpen(false);
  };

  const handleSafetyStockChange = (val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0) {
      setMinSafetyStock(num);
      
      // Log SELECT check
      const query = `SELECT Product_Name, Category, Stock_Quantity, Suppliers.Supplier_Name
FROM Products
JOIN Suppliers ON Products.Supplier_ID = Suppliers.Supplier_ID
WHERE Stock_Quantity < ${num};`;
      onLogSql(query, `Queried safety stock threshold below ${num} items`, products.filter(p => p.Stock_Quantity < num).length);
    } else if (val === '') {
      setMinSafetyStock(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Products Catalog</h2>
          <p className="text-sm text-slate-500">Track current items, edit categories, prices, and map stock levels to vendors.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          disabled={suppliers.length === 0}
          className={`inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer ${
            suppliers.length === 0 ? 'opacity-50 cursor-not-allowed bg-slate-400 hover:bg-slate-400' : ''
          }`}
          title={suppliers.length === 0 ? "You must add a Supplier first before creating products!" : ""}
        >
          <Plus className="w-4.5 h-4.5" /> Add Product
        </button>
      </div>

      {suppliers.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-semibold flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>DBMS Constraint Warning: You cannot register products until at least one Supplier is created. Please add a Supplier first!</span>
        </div>
      )}

      {/* Grid: Main Table + Safety Stock Check Block */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main List Column */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            
            {/* Catalog Controls */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Product Catalog ({filteredProducts.length} records)
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                {/* Category Dropdown */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl pl-8.5 pr-8 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="All">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Search Text */}
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                  <input
                    type="text"
                    placeholder="Search name, category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 placeholder-slate-400"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Catalog Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/20 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    <th className="py-3 px-5">ID</th>
                    <th className="py-3 px-5">Product Name</th>
                    <th className="py-3 px-5">Category</th>
                    <th className="py-3 px-5 text-right">Unit Price</th>
                    <th className="py-3 px-5 text-right">In Stock</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        No product inventory logged.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      const isLowStock = product.Stock_Quantity < minSafetyStock;
                      return (
                        <tr key={product.Product_ID} className={`hover:bg-slate-50/40 transition-all ${isLowStock ? 'bg-rose-50/10' : ''}`}>
                          <td className="py-3.5 px-5 font-mono text-xs text-slate-400">
                            {product.Product_ID}
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="font-semibold text-slate-800">{product.Product_Name}</div>
                            <div className="text-[10px] text-slate-400">
                              Vendor: {getSupplierName(product.Supplier_ID)}
                            </div>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className="inline-flex px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-md">
                              {product.Category}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-right font-mono text-slate-600 font-medium">
                            ${product.Unit_Price.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-5 text-right font-mono">
                            <div className="flex flex-col items-end">
                              <span className={`font-bold ${isLowStock ? 'text-rose-600' : 'text-slate-800'}`}>
                                {product.Stock_Quantity}
                              </span>
                              {isLowStock && (
                                <span className="text-[9px] text-rose-500 font-bold tracking-wider uppercase">LOW STOCK</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEdit(product)}
                                className="p-1.5 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                                title="Edit Product"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteProduct(product.Product_ID)}
                                className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: DBMS Feature 1 - Safety Stock Tracker */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-full inline-block mb-1.5 uppercase">
                DBMS Core Requirement #1
              </span>
              <h3 className="text-sm font-bold text-slate-800">Minimum Safety Stock Watch</h3>
              <p className="text-xs text-slate-400 mt-0.5">Flags items falling below the threshold for immediate order.</p>
            </div>

            {/* Threshold Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600">Minimum Safety Stock Level</label>
              <div className="relative">
                <Box className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="Enter threshold quantity..."
                  value={minSafetyStock === 0 ? '' : minSafetyStock}
                  onChange={(e) => handleSafetyStockChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9.5 pr-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-700"
                />
              </div>
              <span className="text-[10px] text-slate-400 block">
                Products with stock strictly less than this quantity will be filtered.
              </span>
            </div>

            {/* Simulated SQL display */}
            <div className="bg-slate-950 p-3 rounded-xl font-mono text-[11px] text-emerald-400 border border-slate-800 overflow-x-auto space-y-1">
              <div className="text-slate-500 font-sans font-bold text-[9px] uppercase tracking-wider">Simulated Relational SQL</div>
              <div className="whitespace-pre">
                {`SELECT Product_Name, Category, Stock_Quantity, Suppliers.Supplier_Name\nFROM Products\nJOIN Suppliers\n  ON Products.Supplier_ID = Suppliers.Supplier_ID\nWHERE Stock_Quantity < ${minSafetyStock};`}
              </div>
            </div>

            {/* Alert List Output */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Flagged Safety Stock ({lowStockProducts.length} items)</span>
                {lowStockProducts.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-sm border border-rose-100">
                    <ShieldAlert className="w-3 h-3" /> Reorder Triggered
                  </span>
                )}
              </div>

              {lowStockProducts.length === 0 ? (
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 text-emerald-800 rounded-xl text-center text-xs font-semibold">
                  ✔ All products satisfy safety levels.
                </div>
              ) : (
                <div className="border border-slate-100 rounded-xl overflow-hidden text-xs max-h-56 overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/70 text-[10px] font-bold text-slate-400 border-b border-slate-100 uppercase">
                      <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2 text-right">Stock</th>
                        <th className="p-2">Supplier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {lowStockProducts.map((p) => (
                        <tr key={p.Product_ID} className="bg-rose-50/5 hover:bg-rose-50/10">
                          <td className="p-2 font-medium text-slate-800">
                            <div>{p.Product_Name}</div>
                            <span className="text-[9px] text-slate-400 font-normal">{p.Category}</span>
                          </td>
                          <td className="p-2 text-right font-bold text-rose-600 font-mono">{p.Stock_Quantity}</td>
                          <td className="p-2 text-slate-500 font-medium line-clamp-1 mt-1">{getSupplierName(p.Supplier_ID)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Product Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsFormOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />
          
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? `Edit Product Catalog ID #${editingProduct.Product_ID}` : 'Insert New Catalog Product'}
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

              {/* Product Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Product Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Intel Core Ultra 9"
                  value={formData.Product_Name}
                  onChange={(e) => setFormData({ ...formData, Product_Name: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 placeholder-slate-400"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Category *</label>
                <input
                  type="text"
                  placeholder="e.g. Electronics, Accessories, Furniture"
                  value={formData.Category}
                  onChange={(e) => setFormData({ ...formData, Category: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 placeholder-slate-400"
                />
              </div>

              {/* Price & Quantity Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Unit Price ($) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={formData.Unit_Price}
                      onChange={(e) => setFormData({ ...formData, Unit_Price: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Initial Stock *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.Stock_Quantity}
                    onChange={(e) => setFormData({ ...formData, Stock_Quantity: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Supplier Dropdown */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Supplier * (Relational FK)</label>
                <select
                  value={formData.Supplier_ID}
                  onChange={(e) => setFormData({ ...formData, Supplier_ID: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer"
                >
                  {suppliers.map((sup) => (
                    <option key={sup.Supplier_ID} value={sup.Supplier_ID}>
                      {sup.Supplier_Name} ({sup.City})
                    </option>
                  ))}
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
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
