import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@libsql/client';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// --- DATABASE CONFIGURATION ---
// Fallback to local SQLite file if Turso is not configured.
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

const isRemote = !!(TURSO_URL && TURSO_URL.startsWith('libsql://'));
const dbUrl = TURSO_URL || ('file:' + path.join(process.cwd(), 'local.db'));

console.log(`[Database] Connecting to ${isRemote ? 'Turso Cloud Database' : 'Local SQLite database file'} (${dbUrl})`);

const db = createClient({
  url: dbUrl,
  authToken: TURSO_TOKEN,
});

// --- HELPER TO LOG SQL TO DB ---
async function logSqlTrace(query: string, description: string, affectedRows: number) {
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

// --- DATABASE INITIALIZATION & SEEDING ---
async function initDatabase() {
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
  } catch (error) {
    console.error('[Database] Critical error initializing database:', error);
  }
}

// --- API ENDPOINTS ---

// SUPPLIERS
app.get('/api/suppliers', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM Suppliers ORDER BY Supplier_ID ASC');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/suppliers', async (req, res) => {
  const { Supplier_Name, Contact_Person, City } = req.body;
  if (!Supplier_Name || !Contact_Person || !City) {
    return res.status(400).json({ error: 'Missing required supplier fields' });
  }

  const query = 'INSERT INTO Suppliers (Supplier_Name, Contact_Person, City) VALUES (?, ?, ?)';
  try {
    const result = await db.execute({
      sql: query,
      args: [Supplier_Name, Contact_Person, City]
    });
    const insertedId = Number(result.lastInsertRowid);
    const newSupplier = { Supplier_ID: insertedId, Supplier_Name, Contact_Person, City };

    await logSqlTrace(
      `INSERT INTO Suppliers (Supplier_Name, Contact_Person, City)\nVALUES ('${Supplier_Name}', '${Contact_Person}', '${City}');`,
      `Registered supplier "${Supplier_Name}"`,
      1
    );

    res.status(201).json(newSupplier);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/suppliers/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { Supplier_Name, Contact_Person, City } = req.body;

  const query = 'UPDATE Suppliers SET Supplier_Name = ?, Contact_Person = ?, City = ? WHERE Supplier_ID = ?';
  try {
    await db.execute({
      sql: query,
      args: [Supplier_Name, Contact_Person, City, id]
    });

    await logSqlTrace(
      `UPDATE Suppliers\nSET Supplier_Name = '${Supplier_Name}', Contact_Person = '${Contact_Person}', City = '${City}'\nWHERE Supplier_ID = ${id};`,
      `Updated supplier details for "${Supplier_Name}"`,
      1
    );

    res.json({ Supplier_ID: id, Supplier_Name, Contact_Person, City });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    // Foreign key constraint check
    const checkProducts = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM Products WHERE Supplier_ID = ?',
      args: [id]
    });
    const productCount = Number(checkProducts.rows[0].count);

    if (productCount > 0) {
      return res.status(400).json({
        error: `[FOREIGN KEY CONSTRAINT VIOLATION]: Cannot delete supplier because ${productCount} products belong to it.`
      });
    }

    await db.execute({
      sql: 'DELETE FROM Suppliers WHERE Supplier_ID = ?',
      args: [id]
    });

    await logSqlTrace(
      `DELETE FROM Suppliers WHERE Supplier_ID = ${id};`,
      `Deleted supplier ID ${id}`,
      1
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PRODUCTS
app.get('/api/products', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM Products ORDER BY Product_ID ASC');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  const { Product_Name, Category, Unit_Price, Stock_Quantity, Supplier_ID } = req.body;
  
  const query = 'INSERT INTO Products (Product_Name, Category, Unit_Price, Stock_Quantity, Supplier_ID) VALUES (?, ?, ?, ?, ?)';
  try {
    const result = await db.execute({
      sql: query,
      args: [Product_Name, Category, parseFloat(Unit_Price), parseInt(Stock_Quantity, 10), parseInt(Supplier_ID, 10)]
    });
    const insertedId = Number(result.lastInsertRowid);
    const newProduct = {
      Product_ID: insertedId,
      Product_Name,
      Category,
      Unit_Price: parseFloat(Unit_Price),
      Stock_Quantity: parseInt(Stock_Quantity, 10),
      Supplier_ID: parseInt(Supplier_ID, 10)
    };

    await logSqlTrace(
      `INSERT INTO Products (Product_Name, Category, Unit_Price, Stock_Quantity, Supplier_ID)\nVALUES ('${Product_Name}', '${Category}', ${Unit_Price}, ${Stock_Quantity}, ${Supplier_ID});`,
      `Added product catalog entry for "${Product_Name}"`,
      1
    );

    res.status(201).json(newProduct);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { Product_Name, Category, Unit_Price, Stock_Quantity, Supplier_ID } = req.body;

  const query = 'UPDATE Products SET Product_Name = ?, Category = ?, Unit_Price = ?, Stock_Quantity = ?, Supplier_ID = ? WHERE Product_ID = ?';
  try {
    await db.execute({
      sql: query,
      args: [Product_Name, Category, parseFloat(Unit_Price), parseInt(Stock_Quantity, 10), parseInt(Supplier_ID, 10), id]
    });

    await logSqlTrace(
      `UPDATE Products\nSET Product_Name = '${Product_Name}', Category = '${Category}', Unit_Price = ${Unit_Price}, Stock_Quantity = ${Stock_Quantity}, Supplier_ID = ${Supplier_ID}\nWHERE Product_ID = ${id};`,
      `Updated catalog details for "${Product_Name}"`,
      1
    );

    res.json({
      Product_ID: id,
      Product_Name,
      Category,
      Unit_Price: parseFloat(Unit_Price),
      Stock_Quantity: parseInt(Stock_Quantity, 10),
      Supplier_ID: parseInt(Supplier_ID, 10)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    // Foreign key constraint check
    const checkOrders = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM Stock_Orders WHERE Product_ID = ?',
      args: [id]
    });
    const orderCount = Number(checkOrders.rows[0].count);

    if (orderCount > 0) {
      return res.status(400).json({
        error: `[FOREIGN KEY CONSTRAINT VIOLATION]: Cannot delete product because ${orderCount} Stock Orders reference it.`
      });
    }

    await db.execute({
      sql: 'DELETE FROM Products WHERE Product_ID = ?',
      args: [id]
    });

    await logSqlTrace(
      `DELETE FROM Products WHERE Product_ID = ${id};`,
      `Deleted product ID ${id}`,
      1
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// STOCK ORDERS
app.get('/api/orders', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM Stock_Orders ORDER BY Order_ID DESC');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  const { Product_ID, Quantity_Ordered, Order_Date, Delivery_Status } = req.body;

  const query = 'INSERT INTO Stock_Orders (Product_ID, Quantity_Ordered, Order_Date, Delivery_Status) VALUES (?, ?, ?, ?)';
  try {
    const result = await db.execute({
      sql: query,
      args: [parseInt(Product_ID, 10), parseInt(Quantity_Ordered, 10), Order_Date, Delivery_Status]
    });
    const insertedId = Number(result.lastInsertRowid);
    const newOrder = {
      Order_ID: insertedId,
      Product_ID: parseInt(Product_ID, 10),
      Quantity_Ordered: parseInt(Quantity_Ordered, 10),
      Order_Date,
      Delivery_Status
    };

    await logSqlTrace(
      `INSERT INTO Stock_Orders (Product_ID, Quantity_Ordered, Order_Date, Delivery_Status)\nVALUES (${Product_ID}, ${Quantity_Ordered}, '${Order_Date}', '${Delivery_Status}');`,
      `Placed Stock Order #${insertedId}`,
      1
    );

    res.status(201).json(newOrder);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// BULK ORDERS
app.post('/api/orders/bulk', async (req, res) => {
  const { orders } = req.body; // Array of { Product_ID, Quantity_Ordered, Order_Date, Delivery_Status }
  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    return res.status(400).json({ error: 'No orders provided for bulk submission' });
  }

  try {
    const statements = orders.map(o => ({
      sql: 'INSERT INTO Stock_Orders (Product_ID, Quantity_Ordered, Order_Date, Delivery_Status) VALUES (?, ?, ?, ?)',
      args: [o.Product_ID, o.Quantity_Ordered, o.Order_Date, o.Delivery_Status]
    }));

    await db.batch(statements);

    const productsCount = orders.length;

    // Create a trace of the transaction
    let sqlTransactionBlock = `-- Dynamic SQL Transaction Block\nBEGIN TRANSACTION;\n`;
    orders.forEach(o => {
      sqlTransactionBlock += `INSERT INTO Stock_Orders (Product_ID, Quantity_Ordered, Order_Date, Delivery_Status) VALUES (${o.Product_ID}, ${o.Quantity_Ordered}, '${o.Order_Date}', 'Pending');\n`;
    });
    sqlTransactionBlock += `COMMIT;`;

    await logSqlTrace(
      sqlTransactionBlock,
      `Successfully processed bulk stock requisition for ${productsCount} item kinds`,
      productsCount
    );

    res.status(201).json({ success: true, count: productsCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE ORDER (with auto stock updates)
app.put('/api/orders/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { Product_ID, Quantity_Ordered, Order_Date, Delivery_Status } = req.body;

  try {
    // 1. Get previous order state
    const prevResult = await db.execute({
      sql: 'SELECT * FROM Stock_Orders WHERE Order_ID = ?',
      args: [id]
    });
    
    if (prevResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const previousOrder = prevResult.rows[0];
    const prevStatus = previousOrder.Delivery_Status;
    
    let stockAdjustmentMsg = '';

    // 2. Perform SQLite transaction for order update and potential product stock triggers
    if (prevStatus !== 'Delivered' && Delivery_Status === 'Delivered') {
      // Stock arrived trigger
      await db.batch([
        {
          sql: 'UPDATE Stock_Orders SET Delivery_Status = ? WHERE Order_ID = ?',
          args: [Delivery_Status, id]
        },
        {
          sql: 'UPDATE Products SET Stock_Quantity = Stock_Quantity + ? WHERE Product_ID = ?',
          args: [parseInt(Quantity_Ordered, 10), parseInt(Product_ID, 10)]
        }
      ]);

      stockAdjustmentMsg = ` Received cargo: Stock increased by ${Quantity_Ordered} units!`;

      // Log database trigger simulation
      await logSqlTrace(
        `-- RECONCILIATION TRIGGER (Simulated on Delivered status)\nUPDATE Products\nSET Stock_Quantity = Stock_Quantity + ${Quantity_Ordered}\nWHERE Product_ID = ${Product_ID};`,
        `Simulated DBMS trigger: Stock arrived for product ID ${Product_ID}`,
        1
      );
    } else {
      // Standard order details update
      await db.execute({
        sql: 'UPDATE Stock_Orders SET Product_ID = ?, Quantity_Ordered = ?, Order_Date = ?, Delivery_Status = ? WHERE Order_ID = ?',
        args: [parseInt(Product_ID, 10), parseInt(Quantity_Ordered, 10), Order_Date, Delivery_Status, id]
      });
    }

    await logSqlTrace(
      `UPDATE Stock_Orders\nSET Product_ID = ${Product_ID}, Quantity_Ordered = ${Quantity_Ordered}, Order_Date = '${Order_Date}', Delivery_Status = '${Delivery_Status}'\nWHERE Order_ID = ${id};`,
      `Saved details for Order #${id}.${stockAdjustmentMsg}`,
      1
    );

    res.json({
      Order_ID: id,
      Product_ID: parseInt(Product_ID, 10),
      Quantity_Ordered: parseInt(Quantity_Ordered, 10),
      Order_Date,
      Delivery_Status,
      stockAdjustmentMsg
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    await db.execute({
      sql: 'DELETE FROM Stock_Orders WHERE Order_ID = ?',
      args: [id]
    });

    await logSqlTrace(
      `DELETE FROM Stock_Orders WHERE Order_ID = ${id};`,
      `Deleted stock order #${id}`,
      1
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// LOGS
app.get('/api/sql-logs', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM Sql_Logs ORDER BY timestamp DESC LIMIT 100');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sql-logs', async (req, res) => {
  try {
    await db.execute('DELETE FROM Sql_Logs');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sql-logs', async (req, res) => {
  const { query, description, affectedRows } = req.body;
  try {
    await logSqlTrace(query || '', description || '', affectedRows || 0);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// RAW SQL QUERY EXECUTION FOR PLAYGROUND
app.post('/api/run-query', async (req, res) => {
  const { query, params } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'No SQL query provided' });
  }

  try {
    // Basic sanitization/prevention of destructive operations if desired, but this is an educational SQL explorer.
    // Let's just execute the query directly!
    const result = await db.execute({ sql: query, args: params || [] });
    
    // Log the manual playground execution to our query tracing logs as well!
    await logSqlTrace(
      query,
      `Playground custom query execution`,
      result.rows.length
    );

    res.json({
      success: true,
      columns: result.columns || [],
      rows: result.rows || []
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// --- VITE MIDDLEWARE & STATIC ASSET SERVING ---
async function startServer() {
  // Initialize SQLite schema and seeds first
  await initDatabase();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
