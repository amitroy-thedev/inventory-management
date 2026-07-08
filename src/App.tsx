import React, { useState, useEffect } from 'react';
import { Database, HelpCircle } from 'lucide-react';
import { Supplier, Product, StockOrder, SqlQueryLog, ActiveTab, DeliveryStatus } from './types';
import { INITIAL_SUPPLIERS, INITIAL_PRODUCTS, INITIAL_ORDERS } from './mockData';

// Component imports
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import SuppliersView from './components/SuppliersView';
import ProductsView from './components/ProductsView';
import OrdersView from './components/OrdersView';
import ReportsView from './components/ReportsView';
import SqlConsole from './components/SqlConsole';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';

export default function App() {
  // --- DATABASE STATE ---
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<StockOrder[]>([]);
  const [sqlLogs, setSqlLogs] = useState<SqlQueryLog[]>([]);
  
  // --- CONFIG / APP STATE ---
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [minSafetyStock, setMinSafetyStock] = useState<number>(5);

  // --- REUSABLE UI STATE ---
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // --- FULL-STACK SYNCHRONIZATION ---
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Initialize database first
        await fetch('/api/init-db');
        
        const [supRes, prodRes, ordRes, logRes] = await Promise.all([
          fetch('/api/suppliers').then(res => res.json()),
          fetch('/api/products').then(res => res.json()),
          fetch('/api/orders').then(res => res.json()),
          fetch('/api/sql-logs').then(res => res.json())
        ]);
        setSuppliers(supRes);
        setProducts(prodRes);
        setOrders(ordRes);
        setSqlLogs(logRes);
      } catch (error) {
        console.error('Error synchronizing database data:', error);
        showToastNotification('Failed to synchronize database data with the backend.', 'error');
      }
    };

    loadInitialData();

    // Min Safety Stock client preference
    const storedStock = localStorage.getItem('config_safety_stock');
    if (storedStock) {
      setMinSafetyStock(parseInt(storedStock, 10));
    }
  }, []);

  // --- SQL TRACE LOGGER HELPER ---
  const handleLogSql = async (query: string, description: string, affectedRows: number) => {
    try {
      const res = await fetch('/api/sql-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, description, affectedRows })
      });
      if (res.ok) {
        const logRes = await fetch('/api/sql-logs').then(r => r.json());
        setSqlLogs(logRes);
      }
    } catch (err) {
      console.error('Error logging SQL trace:', err);
    }
  };

  const handleClearSqlLogs = async () => {
    try {
      const res = await fetch('/api/sql-logs', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to clear logs on server');
      setSqlLogs([]);
      showToastNotification('SQL Logs tracing database cleared successfully', 'success');
    } catch (err: any) {
      showToastNotification(err.message, 'error');
    }
  };

  // --- TOAST TRIGGER HELPER ---
  const showToastNotification = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  // --- UPDATE MIN SAFETY STOCK ---
  const handleUpdateMinSafetyStock = (num: number) => {
    setMinSafetyStock(num);
    localStorage.setItem('config_safety_stock', num.toString());
  };

  // ============================================
  //   SUPPLIERS CRUD OPERATIONS
  // ============================================

  const handleAddSupplier = async (newSup: Omit<Supplier, 'Supplier_ID'>) => {
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSup)
      });
      if (!res.ok) throw new Error('Failed to register supplier');
      const added = await res.json();
      setSuppliers(prev => [...prev, added]);
      
      const logRes = await fetch('/api/sql-logs').then(r => r.json());
      setSqlLogs(logRes);
      showToastNotification(`Registered supplier "${added.Supplier_Name}" successfully.`, 'success');
    } catch (err: any) {
      showToastNotification(err.message, 'error');
    }
  };

  const handleEditSupplier = async (updatedSup: Supplier) => {
    try {
      const res = await fetch(`/api/suppliers/${updatedSup.Supplier_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSup)
      });
      if (!res.ok) throw new Error('Failed to update supplier');
      setSuppliers(prev => prev.map(s => s.Supplier_ID === updatedSup.Supplier_ID ? updatedSup : s));
      
      const logRes = await fetch('/api/sql-logs').then(r => r.json());
      setSqlLogs(logRes);
      showToastNotification(`Updated supplier details for "${updatedSup.Supplier_Name}".`, 'success');
    } catch (err: any) {
      showToastNotification(err.message, 'error');
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    const targetSup = suppliers.find(s => s.Supplier_ID === id);
    if (!targetSup) return;

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Delete Supplier',
      message: `Are you sure you want to delete supplier "${targetSup.Supplier_Name}"? This operation cannot be undone.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/suppliers/${id}`, {
            method: 'DELETE'
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Failed to delete supplier');
          }
          setSuppliers(prev => prev.filter(s => s.Supplier_ID !== id));
          
          const logRes = await fetch('/api/sql-logs').then(r => r.json());
          setSqlLogs(logRes);
          showToastNotification(`Supplier "${targetSup.Supplier_Name}" deleted from database.`, 'success');
        } catch (err: any) {
          showToastNotification(err.message, 'error');
        }
      }
    });
  };

  // ============================================
  //   PRODUCTS CRUD OPERATIONS
  // ============================================

  const handleAddProduct = async (newProd: Omit<Product, 'Product_ID'>) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProd)
      });
      if (!res.ok) throw new Error('Failed to add product');
      const added = await res.json();
      setProducts(prev => [...prev, added]);
      
      const logRes = await fetch('/api/sql-logs').then(r => r.json());
      setSqlLogs(logRes);
      showToastNotification(`Added "${added.Product_Name}" to the database.`, 'success');
    } catch (err: any) {
      showToastNotification(err.message, 'error');
    }
  };

  const handleEditProduct = async (updatedProd: Product) => {
    try {
      const res = await fetch(`/api/products/${updatedProd.Product_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProd)
      });
      if (!res.ok) throw new Error('Failed to update product');
      setProducts(prev => prev.map(p => p.Product_ID === updatedProd.Product_ID ? updatedProd : p));
      
      const logRes = await fetch('/api/sql-logs').then(r => r.json());
      setSqlLogs(logRes);
      showToastNotification(`Updated catalog details for "${updatedProd.Product_Name}".`, 'success');
    } catch (err: any) {
      showToastNotification(err.message, 'error');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    const targetProd = products.find(p => p.Product_ID === id);
    if (!targetProd) return;

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Delete Product',
      message: `Are you sure you want to delete product "${targetProd.Product_Name}"? This will erase it from the system catalog.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/products/${id}`, {
            method: 'DELETE'
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Failed to delete product');
          }
          setProducts(prev => prev.filter(p => p.Product_ID !== id));
          
          const logRes = await fetch('/api/sql-logs').then(r => r.json());
          setSqlLogs(logRes);
          showToastNotification(`Product "${targetProd.Product_Name}" deleted from catalog.`, 'success');
        } catch (err: any) {
          showToastNotification(err.message, 'error');
        }
      }
    });
  };

  // ============================================
  //   STOCK ORDERS CRUD OPERATIONS
  // ============================================

  const handleAddOrder = async (newOrder: Omit<StockOrder, 'Order_ID'>) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
      if (!res.ok) throw new Error('Failed to place stock order');
      const added = await res.json();
      
      // Reload orders and products from backend
      const [ordRes, logRes] = await Promise.all([
        fetch('/api/orders').then(r => r.json()),
        fetch('/api/sql-logs').then(r => r.json())
      ]);
      setOrders(ordRes);
      setSqlLogs(logRes);
      showToastNotification(`Placed Stock Order #${added.Order_ID} successfully.`, 'success');
    } catch (err: any) {
      showToastNotification(err.message, 'error');
    }
  };

  const handleAddBulkOrders = async (newOrdersList: Omit<StockOrder, 'Order_ID'>[]) => {
    try {
      const res = await fetch('/api/orders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: newOrdersList })
      });
      if (!res.ok) throw new Error('Failed to place bulk stock orders');
      
      const [ordRes, logRes] = await Promise.all([
        fetch('/api/orders').then(r => r.json()),
        fetch('/api/sql-logs').then(r => r.json())
      ]);
      setOrders(ordRes);
      setSqlLogs(logRes);
      showToastNotification(`Successfully created ${newOrdersList.length} stock orders in one submission!`, 'success');
    } catch (err: any) {
      showToastNotification(err.message, 'error');
    }
  };

  const handleEditOrder = async (updatedOrder: StockOrder) => {
    try {
      const res = await fetch(`/api/orders/${updatedOrder.Order_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder)
      });
      if (!res.ok) throw new Error('Failed to update order');
      const saved = await res.json();

      const [prodRes, ordRes, logRes] = await Promise.all([
        fetch('/api/products').then(r => r.json()),
        fetch('/api/orders').then(r => r.json()),
        fetch('/api/sql-logs').then(r => r.json())
      ]);
      setProducts(prodRes);
      setOrders(ordRes);
      setSqlLogs(logRes);

      const stockAdjustmentMsg = saved.stockAdjustmentMsg || '';
      showToastNotification(`Saved details for Order #${updatedOrder.Order_ID}.${stockAdjustmentMsg}`, 'success');
    } catch (err: any) {
      showToastNotification(err.message, 'error');
    }
  };

  const handleDeleteOrder = async (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Order Record',
      message: `Are you sure you want to purge the database records for Stock Order #${id}?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/orders/${id}`, {
            method: 'DELETE'
          });
          if (!res.ok) throw new Error('Failed to purge order record');
          setOrders(prev => prev.filter(o => o.Order_ID !== id));
          
          const logRes = await fetch('/api/sql-logs').then(r => r.json());
          setSqlLogs(logRes);
          showToastNotification(`Order record #${id} removed from database.`, 'success');
        } catch (err: any) {
          showToastNotification(err.message, 'error');
        }
      }
    });
  };

  // Navigate to products and automatically trigger safety stock query block
  const handleNavigateToLowStock = () => {
    setActiveTab('products');
    showToastNotification(`Viewing Minimum Safety Stock tracker. Threshold set to ${minSafetyStock}.`, 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans">
      
      {/* Dynamic Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sqlLogsCount={sqlLogs.length}
      />

      {/* Main Panel Content Window */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
        {activeTab === 'dashboard' && (
          <DashboardView
            products={products}
            suppliers={suppliers}
            orders={orders}
            minSafetyStock={minSafetyStock}
            setActiveTab={setActiveTab}
            onNavigateToLowStock={handleNavigateToLowStock}
          />
        )}

        {activeTab === 'suppliers' && (
          <SuppliersView
            suppliers={suppliers}
            onAddSupplier={handleAddSupplier}
            onEditSupplier={handleEditSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            onLogSql={handleLogSql}
          />
        )}

        {activeTab === 'products' && (
          <ProductsView
            products={products}
            suppliers={suppliers}
            minSafetyStock={minSafetyStock}
            setMinSafetyStock={handleUpdateMinSafetyStock}
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onLogSql={handleLogSql}
            showLowStockTrigger={false}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersView
            orders={orders}
            products={products}
            onAddOrder={handleAddOrder}
            onAddBulkOrders={handleAddBulkOrders}
            onEditOrder={handleEditOrder}
            onDeleteOrder={handleDeleteOrder}
            onLogSql={handleLogSql}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            products={products}
            suppliers={suppliers}
            orders={orders}
            minSafetyStock={minSafetyStock}
          />
        )}

        {activeTab === 'sql-console' && (
          <SqlConsole
            products={products}
            suppliers={suppliers}
            orders={orders}
            sqlLogs={sqlLogs}
            onClearLogs={handleClearSqlLogs}
          />
        )}
      </main>

      {/* Persistent Toast Messages notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Safe deletion Confirm Dialog */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
}
