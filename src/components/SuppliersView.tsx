import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, MapPin, X, Building2, Check, HelpCircle } from 'lucide-react';
import { Supplier } from '../types';

interface SuppliersViewProps {
  suppliers: Supplier[];
  onAddSupplier: (supplier: Omit<Supplier, 'Supplier_ID'>) => void;
  onEditSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: number) => void;
  onLogSql: (query: string, description: string, affectedRows: number) => void;
}

export default function SuppliersView({
  suppliers,
  onAddSupplier,
  onEditSupplier,
  onDeleteSupplier,
  onLogSql
}: SuppliersViewProps) {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // DBMS Specific Feature 2: Supplier Search by City
  const [citySearchInput, setCitySearchInput] = useState('');
  const [hasSearchedCity, setHasSearchedCity] = useState(false);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    Supplier_Name: '',
    Contact_Person: '',
    City: ''
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Deletion Modal Trigger
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Filter general list
  const filteredSuppliers = suppliers.filter(s => {
    const term = searchTerm.toLowerCase();
    return (
      s.Supplier_Name.toLowerCase().includes(term) ||
      s.City.toLowerCase().includes(term) ||
      s.Contact_Person.toLowerCase().includes(term)
    );
  });

  // DBMS Specific Feature 2 filtering
  const cityFilteredResults = suppliers.filter(
    s => s.City.trim().toLowerCase() === citySearchInput.trim().toLowerCase()
  );

  // Open form for adding
  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({ Supplier_Name: '', Contact_Person: '', City: '' });
    setFormErrors([]);
    setIsFormOpen(true);
  };

  // Open form for editing
  const handleOpenEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      Supplier_Name: supplier.Supplier_Name,
      Contact_Person: supplier.Contact_Person,
      City: supplier.City
    });
    setFormErrors([]);
    setIsFormOpen(true);
  };

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    // All fields required validation
    if (!formData.Supplier_Name.trim()) errors.push("Supplier Name is required");
    if (!formData.Contact_Person.trim()) errors.push("Contact Person is required");
    if (!formData.City.trim()) errors.push("City is required");

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingSupplier) {
      // Edit
      const updatedSupplier: Supplier = {
        Supplier_ID: editingSupplier.Supplier_ID,
        Supplier_Name: formData.Supplier_Name.trim(),
        Contact_Person: formData.Contact_Person.trim(),
        City: formData.City.trim()
      };
      onEditSupplier(updatedSupplier);

      // Log SQL query
      const sqlQuery = `UPDATE Suppliers 
SET Supplier_Name = '${updatedSupplier.Supplier_Name.replace(/'/g, "''")}', 
    Contact_Person = '${updatedSupplier.Contact_Person.replace(/'/g, "''")}', 
    City = '${updatedSupplier.City.replace(/'/g, "''")}' 
WHERE Supplier_ID = ${updatedSupplier.Supplier_ID};`;
      onLogSql(sqlQuery, `Updated supplier: ${updatedSupplier.Supplier_Name}`, 1);
    } else {
      // Add
      onAddSupplier({
        Supplier_Name: formData.Supplier_Name.trim(),
        Contact_Person: formData.Contact_Person.trim(),
        City: formData.City.trim()
      });

      // Log SQL query (using temporary id string in logs)
      const sqlQuery = `INSERT INTO Suppliers (Supplier_Name, Contact_Person, City) 
VALUES ('${formData.Supplier_Name.replace(/'/g, "''")}', '${formData.Contact_Person.replace(/'/g, "''")}', '${formData.City.replace(/'/g, "''")}');`;
      onLogSql(sqlQuery, `Created new supplier: ${formData.Supplier_Name}`, 1);
    }

    setIsFormOpen(false);
  };

  // DBMS Specific City Search Trigger
  const handleCitySearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearchedCity(true);

    // Log query execution simulation
    const sqlQuery = `SELECT Supplier_Name, Contact_Person, City 
FROM Suppliers 
WHERE City = '${citySearchInput.replace(/'/g, "''")}';`;
    onLogSql(sqlQuery, `Queried suppliers in city: "${citySearchInput}"`, cityFilteredResults.length);
  };

  // Unique list of cities to help users test city search
  const availableCities = Array.from(new Set(suppliers.map(s => s.City)));

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Suppliers Directory</h2>
          <p className="text-sm text-slate-500">Manage vendor contact profiles, cities of operation, and query records.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" /> Add Supplier
        </button>
      </div>

      {/* Grid: Main Table + City Query DBMS Feature */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left/Middle Column: Main Supplier List */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            {/* Table Search Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Supplier Directory ({filteredSuppliers.length} records)
              </span>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search supplier, contact, city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9.5 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-700 placeholder-slate-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Supplier Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/20 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    <th className="py-3 px-5">ID</th>
                    <th className="py-3 px-5">Supplier Name</th>
                    <th className="py-3 px-5">Contact Person</th>
                    <th className="py-3 px-5">City</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                        No suppliers match your search parameters.
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map((supplier) => (
                      <tr key={supplier.Supplier_ID} className="hover:bg-slate-50/40 transition-all">
                        <td className="py-3.5 px-5 font-mono text-xs text-slate-400">
                          {supplier.Supplier_ID}
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-slate-800">
                          {supplier.Supplier_Name}
                        </td>
                        <td className="py-3.5 px-5 text-slate-600">
                          {supplier.Contact_Person}
                        </td>
                        <td className="py-3.5 px-5 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {supplier.City}
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(supplier)}
                              className="p-1.5 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                              title="Edit Supplier"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteSupplier(supplier.Supplier_ID)}
                              className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Delete Supplier"
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
        </div>

        {/* Right Column: DBMS Feature 2 - Supplier Search by City */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-full inline-block mb-1.5 uppercase">
                DBMS Core Requirement #2
              </span>
              <h3 className="text-sm font-bold text-slate-800">Supplier Search by City</h3>
              <p className="text-xs text-slate-400 mt-0.5">Executes dynamic equality checks on the Supplier table.</p>
            </div>

            {/* City Query Input Form */}
            <form onSubmit={handleCitySearchSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Enter City Name</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Boston, Chicago"
                    value={citySearchInput}
                    onChange={(e) => setCitySearchInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9.5 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-700 font-medium"
                  />
                </div>
              </div>

              {/* Quick-select cities chips */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Suggested DB Cities:</span>
                <div className="flex flex-wrap gap-1.5">
                  {availableCities.map(city => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setCitySearchInput(city)}
                      className={`text-[10px] px-2 py-1 rounded-md border transition-all cursor-pointer ${
                        citySearchInput.trim().toLowerCase() === city.toLowerCase()
                          ? 'bg-blue-600 border-blue-600 text-white font-medium'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-900 text-slate-100 hover:bg-slate-800 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Execute SELECT Query
              </button>
            </form>

            {/* SQL Simulation Output Trace */}
            {hasSearchedCity && (
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="bg-slate-950 p-3 rounded-xl font-mono text-[11px] text-emerald-400 border border-slate-800 overflow-x-auto space-y-1">
                  <div className="text-slate-500 font-sans font-bold text-[9px] uppercase tracking-wider">Executed SQL query</div>
                  <div className="whitespace-pre">
                    {`SELECT Supplier_Name, Contact_Person, City\nFROM Suppliers\nWHERE City = '${citySearchInput.replace(/'/g, "''")}';`}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Query Output ({cityFilteredResults.length} records)</span>
                    {cityFilteredResults.length > 0 && <span className="text-[10px] text-emerald-600 font-bold">✔ Success</span>}
                  </div>

                  {cityFilteredResults.length === 0 ? (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-400">
                      No suppliers registered in "{citySearchInput}"
                    </div>
                  ) : (
                    <div className="border border-slate-100 rounded-xl overflow-hidden text-xs max-h-48 overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/70 text-[10px] font-bold text-slate-400 border-b border-slate-100 uppercase">
                          <tr>
                            <th className="p-2">Supplier Name</th>
                            <th className="p-2">Contact Person</th>
                            <th className="p-2">City</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600">
                          {cityFilteredResults.map((s, index) => (
                            <tr key={index} className="hover:bg-slate-50/30">
                              <td className="p-2 font-semibold text-slate-700">{s.Supplier_Name}</td>
                              <td className="p-2">{s.Contact_Person}</td>
                              <td className="p-2 font-mono text-[10px]">{s.City}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Supplier Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsFormOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />
          
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingSupplier ? `Edit Supplier (ID: ${editingSupplier.Supplier_ID})` : 'Register New Supplier'}
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

              {/* Supplier Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Supplier Name *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Enter supplier corporation name"
                    value={formData.Supplier_Name}
                    onChange={(e) => setFormData({ ...formData, Supplier_Name: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9.5 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-700 placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Contact Person */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Contact Person *</label>
                <input
                  type="text"
                  placeholder="Full name of company representative"
                  value={formData.Contact_Person}
                  onChange={(e) => setFormData({ ...formData, Contact_Person: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-700 placeholder-slate-400"
                />
              </div>

              {/* City */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Headquarters City *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="e.g. Boston, Seattle, London"
                    value={formData.City}
                    onChange={(e) => setFormData({ ...formData, City: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9.5 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-700 placeholder-slate-400"
                  />
                </div>
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
                  {editingSupplier ? 'Save Changes' : 'Create Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
