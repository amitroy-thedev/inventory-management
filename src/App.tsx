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

  // --- LOCALSTORAGE INITIALIZATION ---
  useEffect(() => {
    // 1. Suppliers
    const storedSuppliers = localStorage.getItem('db_suppliers');
    if (storedSuppliers) {
      setSuppliers(JSON.parse(storedSuppliers));
    } else {
      setSuppliers(INITIAL_SUPPLIERS);
      localStorage.setItem('db_suppliers', JSON.stringify(INITIAL_SUPPLIERS));
    }

    // 2. Products
    const storedProducts = localStorage.getItem('db_products');
    if (storedProducts) {
      setProducts(JSON.parse(storedProducts));
    } else {
      setProducts(INITIAL_PRODUCTS);
      localStorage.setItem('db_products', JSON.stringify(INITIAL_PRODUCTS));
    }

    // 3. Orders
    const storedOrders = localStorage.getItem('db_orders');
    if (storedOrders) {
      setOrders(JSON.parse(storedOrders));
    } else {
      setOrders(INITIAL_ORDERS);
      localStorage.setItem('db_orders', JSON.stringify(INITIAL_ORDERS));
    }

    // 4. Min Safety Stock
    const storedStock = localStorage.getItem('config_safety_stock');
    if (storedStock) {
      setMinSafetyStock(parseInt(storedStock, 10));
    }

    // 5. Initial SQL logs setup
    const storedLogs = localStorage.getItem('db_sql_logs');
    if (storedLogs) {
      setSqlLogs(JSON.parse(storedLogs));
    } else {
      const initialLogs: SqlQueryLog[] = [
        {
          id: 'init-1',
          timestamp: new Date().toLocaleString(),
          query: `-- SYSTEM BOOTSTRAP\nCREATE TABLE Suppliers (\n  Supplier_ID INT PRIMARY KEY AUTO_INCREMENT,\n  Supplier_Name VARCHAR(100) NOT NULL,\n  Contact_Person VARCHAR(100) NOT NULL,\n  City VARCHAR(50) NOT NULL\n);`,
          description: "Created 'Suppliers' relational table schema",
          affectedRows: 0
        },
        {
          id: 'init-2',
          timestamp: new Date().toLocaleString(),
          query: `CREATE TABLE Products (\n  Product_ID INT PRIMARY KEY AUTO_INCREMENT,\n  Product_Name VARCHAR(150) NOT NULL,\n  Category VARCHAR(50) NOT NULL,\n  Unit_Price DECIMAL(10,2) NOT NULL CHECK(Unit_Price > 0),\n  Stock_Quantity INT NOT NULL DEFAULT 0 CHECK(Stock_Quantity >= 0),\n  Supplier_ID INT,\n  FOREIGN KEY (Supplier_ID) REFERENCES Suppliers(Supplier_ID) ON DELETE RESTRICT\n);`,
          description: "Created 'Products' relational table schema with constraints",
          affectedRows: 0
        },
        {
          id: 'init-3',
          timestamp: new Date().toLocaleString(),
          query: `CREATE TABLE Stock_Orders (\n  Order_ID INT PRIMARY KEY AUTO_INCREMENT,\n  Product_ID INT NOT NULL,\n  Quantity_Ordered INT NOT NULL CHECK(Quantity_Ordered > 0),\n  Order_Date DATE NOT NULL,\n  Delivery_Status VARCHAR(20) NOT NULL DEFAULT 'Pending',\n  FOREIGN KEY (Product_ID) REFERENCES Products(Product_ID) ON DELETE RESTRICT\n);`,
          description: "Created 'Stock_Orders' relational table schema",
          affectedRows: 0
        }
      ];
      setSqlLogs(initialLogs);
      localStorage.setItem('db_sql_logs', JSON.stringify(initialLogs));
    }
  }, []);

  // --- SQL TRACE LOGGER HELPER ---
  const handleLogSql = (query: string, description: string, affectedRows: number) => {
    const newLog: SqlQueryLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleString(),
      query,
      description,
      affectedRows
    };
    
    setSqlLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 100); // Max 100 items for memory
      localStorage.setItem('db_sql_logs', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearSqlLogs = () => {
    setSqlLogs([]);
    localStorage.removeItem('db_sql_logs');
    showToastNotification('SQL Logs tracing database cleared successfully', 'success');
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

  const handleAddSupplier = (newSup: Omit<Supplier, 'Supplier_ID'>) => {
    const nextId = suppliers.length > 0 ? Math.max(...suppliers.map(s => s.Supplier_ID)) + 1 : 1;
    const added: Supplier = {
      Supplier_ID: nextId,
      ...newSup
    };

    const updated = [...suppliers, added];
    setSuppliers(updated);
    localStorage.setItem('db_suppliers', JSON.stringify(updated));
    showToastNotification(`Registered supplier "${added.Supplier_Name}" successfully.`, 'success');
  };

  const handleEditSupplier = (updatedSup: Supplier) => {
    const updated = suppliers.map(s => s.Supplier_ID === updatedSup.Supplier_ID ? updatedSup : s);
    setSuppliers(updated);
    localStorage.setItem('db_suppliers', JSON.stringify(updated));
    showToastNotification(`Updated supplier details for "${updatedSup.Supplier_Name}".`, 'success');
  };

  const handleDeleteSupplier = (id: number) => {
    const targetSup = suppliers.find(s => s.Supplier_ID === id);
    if (!targetSup) return;

    // --- RELATIONAL INTEGRITY CHECK ---
    // Rule: Suppliers has Products. Supplier_ID is FK in Products. Cannot delete if Products exist referencing it.
    const productCount = products.filter(p => p.Supplier_ID === id).length;
    if (productCount > 0) {
      showToastNotification(
        `[FOREIGN KEY CONSTRAINT VIOLATION]: Cannot delete supplier "${targetSup.Supplier_Name}" because ${productCount} products belong to it.`,
        'error'
      );
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Delete Supplier',
      message: `Are you sure you want to delete supplier "${targetSup.Supplier_Name}"? This operation cannot be undone.`,
      onConfirm: () => {
        const updated = suppliers.filter(s => s.Supplier_ID !== id);
        setSuppliers(updated);
        localStorage.setItem('db_suppliers', JSON.stringify(updated));
        
        // Log SQL Trace
        const sqlQuery = `DELETE FROM Suppliers WHERE Supplier_ID = ${id};`;
        handleLogSql(sqlQuery, `Deleted supplier: ${targetSup.Supplier_Name}`, 1);
        showToastNotification(`Supplier "${targetSup.Supplier_Name}" deleted from database.`, 'success');
      }
    });
  };

  // ============================================
  //   PRODUCTS CRUD OPERATIONS
  // ============================================

  const handleAddProduct = (newProd: Omit<Product, 'Product_ID'>) => {
    const nextId = products.length > 0 ? Math.max(...products.map(p => p.Product_ID)) + 1 : 101;
    const added: Product = {
      Product_ID: nextId,
      ...newProd
    };

    const updated = [...products, added];
    setProducts(updated);
    localStorage.setItem('db_products', JSON.stringify(updated));
    showToastNotification(`Added "${added.Product_Name}" to the database.`, 'success');
  };

  const handleEditProduct = (updatedProd: Product) => {
    const updated = products.map(p => p.Product_ID === updatedProd.Product_ID ? updatedProd : p);
    setProducts(updated);
    localStorage.setItem('db_products', JSON.stringify(updated));
    showToastNotification(`Updated catalog details for "${updatedProd.Product_Name}".`, 'success');
  };

  const handleDeleteProduct = (id: number) => {
    const targetProd = products.find(p => p.Product_ID === id);
    if (!targetProd) return;

    // --- RELATIONAL INTEGRITY CHECK ---
    // Rule: Product has Stock Orders. Product_ID is FK in Stock Orders. Cannot delete if orders reference it.
    const ordersCount = orders.filter(o => o.Product_ID === id).length;
    if (ordersCount > 0) {
      showToastNotification(
        `[FOREIGN KEY CONSTRAINT VIOLATION]: Cannot delete "${targetProd.Product_Name}" because ${ordersCount} Stock Orders are referencing this product.`,
        'error'
      );
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Delete Product',
      message: `Are you sure you want to delete product "${targetProd.Product_Name}"? This will erase it from the system catalog.`,
      onConfirm: () => {
        const updated = products.filter(p => p.Product_ID !== id);
        setProducts(updated);
        localStorage.setItem('db_products', JSON.stringify(updated));
        
        // Log SQL Trace
        const sqlQuery = `DELETE FROM Products WHERE Product_ID = ${id};`;
        handleLogSql(sqlQuery, `Deleted product: ${targetProd.Product_Name}`, 1);
        showToastNotification(`Product "${targetProd.Product_Name}" deleted from catalog.`, 'success');
      }
    });
  };

  // ============================================
  //   STOCK ORDERS CRUD OPERATIONS
  // ============================================

  const handleAddOrder = (newOrder: Omit<StockOrder, 'Order_ID'>) => {
    const nextId = orders.length > 0 ? Math.max(...orders.map(o => o.Order_ID)) + 1 : 5001;
    const added: StockOrder = {
      Order_ID: nextId,
      ...newOrder
    };

    const updated = [added, ...orders];
    setOrders(updated);
    localStorage.setItem('db_orders', JSON.stringify(updated));
    showToastNotification(`Placed Stock Order #${added.Order_ID} successfully.`, 'success');
  };

  const handleAddBulkOrders = (newOrdersList: Omit<StockOrder, 'Order_ID'>[]) => {
    let nextId = orders.length > 0 ? Math.max(...orders.map(o => o.Order_ID)) + 1 : 5001;
    
    const addedList: StockOrder[] = newOrdersList.map(item => {
      const added: StockOrder = {
        Order_ID: nextId,
        ...item
      };
      nextId++;
      return added;
    });

    const updated = [...addedList, ...orders];
    setOrders(updated);
    localStorage.setItem('db_orders', JSON.stringify(updated));
    showToastNotification(`Successfully created ${addedList.length} stock orders in one submission!`, 'success');
  };

  const handleEditOrder = (updatedOrder: StockOrder) => {
    // Determine status changes to perform real stock simulation adjustments if delivered!
    const previousOrder = orders.find(o => o.Order_ID === updatedOrder.Order_ID);
    
    let stockAdjustmentMsg = '';
    const updatedProducts = [...products];

    if (previousOrder && previousOrder.Delivery_Status !== 'Delivered' && updatedOrder.Delivery_Status === 'Delivered') {
      // Simulate inventory stock arrival! Add Quantity_Ordered to Stock_Quantity!
      const targetProdIndex = updatedProducts.findIndex(p => p.Product_ID === updatedOrder.Product_ID);
      if (targetProdIndex !== -1) {
        updatedProducts[targetProdIndex].Stock_Quantity += updatedOrder.Quantity_Ordered;
        setProducts(updatedProducts);
        localStorage.setItem('db_products', JSON.stringify(updatedProducts));
        stockAdjustmentMsg = ` Recieved cargo: Stock increased by ${updatedOrder.Quantity_Ordered} units!`;

        // Log SQL updates for auto-increment simulated triggers
        const triggerQuery = `-- RECONCILIATION TRIGGER (Simulated on Delivered status)\nUPDATE Products\nSET Stock_Quantity = Stock_Quantity + ${updatedOrder.Quantity_Ordered}\nWHERE Product_ID = ${updatedOrder.Product_ID};`;
        handleLogSql(triggerQuery, `Simulated DBMS trigger: Stock arrived for product ID ${updatedOrder.Product_ID}`, 1);
      }
    }

    const updatedOrders = orders.map(o => o.Order_ID === updatedOrder.Order_ID ? updatedOrder : o);
    setOrders(updatedOrders);
    localStorage.setItem('db_orders', JSON.stringify(updatedOrders));
    showToastNotification(`Saved details for Order #${updatedOrder.Order_ID}.${stockAdjustmentMsg}`, 'success');
  };

  const handleDeleteOrder = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Order Record',
      message: `Are you sure you want to purge the database records for Stock Order #${id}?`,
      onConfirm: () => {
        const updated = orders.filter(o => o.Order_ID !== id);
        setOrders(updated);
        localStorage.setItem('db_orders', JSON.stringify(updated));
        
        // Log SQL Trace
        const sqlQuery = `DELETE FROM Stock_Orders WHERE Order_ID = ${id};`;
        handleLogSql(sqlQuery, `Deleted stock order #${id}`, 1);
        showToastNotification(`Order record #${id} removed from database.`, 'success');
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
