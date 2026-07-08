import { createClient } from '@libsql/client';
import path from 'path';
import os from 'os';

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

const isRemote = !!(TURSO_URL && TURSO_URL.startsWith('libsql://'));
const dbUrl = TURSO_URL || ('file:' + (process.env.NODE_ENV === 'production' ? path.join(os.tmpdir(), 'local.db') : path.join(process.cwd(), 'local.db')));

console.log(`[Database] Connecting to ${isRemote ? 'Turso Cloud Database' : 'Local SQLite database file'} (${dbUrl})`);

export const db = createClient({
  url: dbUrl,
  authToken: TURSO_TOKEN,
});

let initialized = false;
let initializingPromise: Promise<void> | null = null;

export async function logSqlTrace(query: string, description: string, affectedRows: number) {
  try {
    const id = Math.random().toString(36).substring(2, 9);
    const timestamp = new Date().toLocaleString();
    await db.execute({
      sql: 'INSERT INTO Sql_Logs (id, timestamp, query, description, affectedRows) VALUES (?, ?, ?, ?, ?)',
      args: [id, timestamp, query, description, affectedRows]
    });
  } catch (err) {
    console.error('Error logging SQL trace to db:', err);
  }
}

export async function initDatabase() {
  if (initialized) return;
  if (initializingPromise) return initializingPromise;

  initializingPromise = (async () => {
    try {
      // 1. Create tables
      await db.execute(`
        CREATE TABLE IF NOT EXISTS Suppliers (
          Supplier_ID INTEGER PRIMARY KEY AUTOINCREMENT,
          Supplier_Name TEXT NOT NULL,
          Contact_Person TEXT NOT NULL,
          City TEXT NOT NULL
        );
      `);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS Products (
          Product_ID INTEGER PRIMARY KEY AUTOINCREMENT,
          Product_Name TEXT NOT NULL,
          Category TEXT NOT NULL,
          Unit_Price REAL NOT NULL,
          Stock_Quantity INTEGER NOT NULL DEFAULT 0,
          Supplier_ID INTEGER,
          FOREIGN KEY (Supplier_ID) REFERENCES Suppliers(Supplier_ID) ON DELETE RESTRICT
        );
      `);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS Stock_Orders (
          Order_ID INTEGER PRIMARY KEY AUTOINCREMENT,
          Product_ID INTEGER NOT NULL,
          Quantity_Ordered INTEGER NOT NULL,
          Order_Date TEXT NOT NULL,
          Delivery_Status TEXT NOT NULL DEFAULT 'Pending',
          FOREIGN KEY (Product_ID) REFERENCES Products(Product_ID) ON DELETE RESTRICT
        );
      `);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS Sql_Logs (
          id TEXT PRIMARY KEY,
          timestamp TEXT NOT NULL,
          query TEXT NOT NULL,
          description TEXT NOT NULL,
          affectedRows INTEGER NOT NULL
        );
      `);

      // 2. Check if Suppliers is empty and seed
      const checkSuppliers = await db.execute('SELECT COUNT(*) as count FROM Suppliers');
      const supCount = Number(checkSuppliers.rows[0].count);
      
      if (supCount === 0) {
        console.log('[Database] Seeding initial suppliers...');
        const initialSuppliers = [
          { id: 1, name: 'Apex Logistics', contact: 'Alice Smith', city: 'Boston' },
          { id: 2, name: 'Global Tech Parts', contact: 'Bob Johnson', city: 'New York' },
          { id: 3, name: 'Nova Industries', contact: 'Charlie Brown', city: 'Chicago' },
          { id: 4, name: 'Vanguard Supplies', contact: 'Diana Prince', city: 'Boston' },
          { id: 5, name: 'Horizon Distributors', contact: 'Evan Wright', city: 'Seattle' }
        ];
        for (const s of initialSuppliers) {
          await db.execute({
            sql: 'INSERT INTO Suppliers (Supplier_ID, Supplier_Name, Contact_Person, City) VALUES (?, ?, ?, ?)',
            args: [s.id, s.name, s.contact, s.city]
          });
        }
      }

      // 3. Check if Products is empty and seed
      const checkProducts = await db.execute('SELECT COUNT(*) as count FROM Products');
      const prodCount = Number(checkProducts.rows[0].count);

      if (prodCount === 0) {
        console.log('[Database] Seeding initial products...');
        const initialProducts = [
          { id: 101, name: 'Intel Core i9-13900K', cat: 'Electronics', price: 499.99, qty: 12, supId: 2 },
          { id: 102, name: 'Corsair Vengeance 32GB RAM', cat: 'Electronics', price: 129.99, qty: 4, supId: 2 },
          { id: 103, name: 'Logitech MX Master 3S Mouse', cat: 'Accessories', price: 99.99, qty: 25, supId: 1 },
          { id: 104, name: 'Dell 27" UltraSharp U2723QE', cat: 'Electronics', price: 349.99, qty: 3, supId: 3 },
          { id: 105, name: 'Keychron K2 Mechanical Keyboard', cat: 'Accessories', price: 89.99, qty: 18, supId: 1 },
          { id: 106, name: 'Ergonomic Office Mesh Chair', cat: 'Furniture', price: 249.99, qty: 8, supId: 4 },
          { id: 107, name: 'Standing Desk (Bamboo Top)', cat: 'Furniture', price: 450.00, qty: 2, supId: 4 },
          { id: 108, name: 'Anker USB-C Multiport Hub', cat: 'Accessories', price: 49.99, qty: 40, supId: 5 }
        ];
        for (const p of initialProducts) {
          await db.execute({
            sql: 'INSERT INTO Products (Product_ID, Product_Name, Category, Unit_Price, Stock_Quantity, Supplier_ID) VALUES (?, ?, ?, ?, ?, ?)',
            args: [p.id, p.name, p.cat, p.price, p.qty, p.supId]
          });
        }
      }

      // 4. Check if Orders is empty and seed
      const checkOrders = await db.execute('SELECT COUNT(*) as count FROM Stock_Orders');
      const orderCount = Number(checkOrders.rows[0].count);

      if (orderCount === 0) {
        console.log('[Database] Seeding initial orders...');
        const initialOrders = [
          { id: 5001, prodId: 101, qty: 5, date: '2026-06-25', status: 'Delivered' },
          { id: 5002, prodId: 102, qty: 10, date: '2026-06-26', status: 'Pending' },
          { id: 5003, prodId: 104, qty: 8, date: '2026-06-26', status: 'Ordered' },
          { id: 5004, prodId: 107, qty: 5, date: '2026-06-27', status: 'Pending' },
          { id: 5005, prodId: 105, qty: 12, date: '2026-06-24', status: 'Delivered' },
          { id: 5006, prodId: 108, qty: 20, date: '2026-06-23', status: 'Cancelled' }
        ];
        for (const o of initialOrders) {
          await db.execute({
            sql: 'INSERT INTO Stock_Orders (Order_ID, Product_ID, Quantity_Ordered, Order_Date, Delivery_Status) VALUES (?, ?, ?, ?, ?)',
            args: [o.id, o.prodId, o.qty, o.date, o.status]
          });
        }
      }

      console.log('[Database] Schema and seeding completed successfully!');
      initialized = true;
    } catch (error) {
      console.error('[Database] Critical error initializing database:', error);
      throw error;
    }
  })();

  return initializingPromise;
}

export async function getDb() {
  await initDatabase();
  return db;
}
