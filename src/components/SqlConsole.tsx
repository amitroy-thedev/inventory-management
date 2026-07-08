import React, { useState } from 'react';
import { Database, Terminal, Clock, Play, HelpCircle, Code2, Sparkles } from 'lucide-react';
import { Product, Supplier, StockOrder, SqlQueryLog } from '../types';

interface SqlConsoleProps {
  products: Product[];
  suppliers: Supplier[];
  orders: StockOrder[];
  sqlLogs: SqlQueryLog[];
  onClearLogs: () => void;
}

export default function SqlConsole({
  products,
  suppliers,
  orders,
  sqlLogs,
  onClearLogs
}: SqlConsoleProps) {
  const [activeConsoleTab, setActiveConsoleTab] = useState<'playground' | 'logs'>('playground');
  
  // Playground State
  const [selectedPresetQuery, setSelectedPresetQuery] = useState<number>(1);
  const [cityParameter, setCityParameter] = useState<string>('Boston');
  const [stockParameter, setStockParameter] = useState<number>(5);
  const [customQueryResult, setCustomQueryResult] = useState<any[] | null>(null);
  const [customQueryColumns, setCustomQueryColumns] = useState<string[]>([]);
  const [executedQueryText, setExecutedQueryText] = useState<string>('');

  interface PresetQuery {
    id: number;
    title: string;
    description: string;
    sql: (param?: any) => string;
    run: (p: Product[], s: Supplier[], o: StockOrder[], param?: any) => { columns: string[]; rows: any[] };
  }

  // Preset SQL Queries definitions
  const presetQueries: PresetQuery[] = [
    {
      id: 1,
      title: 'Query 1: Low Stock Detection',
      description: 'Show products whose stock quantities reside below the minimum safety threshold.',
      sql: (threshold?: any) => `SELECT Product_Name, Stock_Quantity\nFROM Products\nWHERE Stock_Quantity < ${Number(threshold) || 0};`,
      run: (p: Product[], s: Supplier[], o: StockOrder[], threshold?: any) => {
        const t = typeof threshold === 'number' ? threshold : parseInt(threshold, 10) || 0;
        const res = p.filter(prod => prod.Stock_Quantity < t);
        return {
          columns: ['Product_Name', 'Stock_Quantity'],
          rows: res.map(prod => ({ Product_Name: prod.Product_Name, Stock_Quantity: prod.Stock_Quantity }))
        };
      }
    },
    {
      id: 2,
      title: 'Query 2: Supplier lookup by City',
      description: 'Find contact information of vendors operating in a specific target city.',
      sql: (city?: any) => `SELECT Supplier_Name, Contact_Person\nFROM Suppliers\nWHERE City = '${String(city || '').replace(/'/g, "''")}';`,
      run: (p: Product[], s: Supplier[], o: StockOrder[], city?: any) => {
        const c = String(city || '').trim().toLowerCase();
        const res = s.filter(sup => sup.City.trim().toLowerCase() === c);
        return {
          columns: ['Supplier_Name', 'Contact_Person'],
          rows: res.map(sup => ({ Supplier_Name: sup.Supplier_Name, Contact_Person: sup.Contact_Person }))
        };
      }
    },
    {
      id: 3,
      title: 'Query 3: View orders with Product Names (JOIN)',
      description: 'Performs an INNER JOIN between Stock_Orders and Products to fetch matching descriptive product titles.',
      sql: () => `SELECT\n  Stock_Orders.Order_ID,\n  Products.Product_Name,\n  Stock_Orders.Quantity_Ordered,\n  Stock_Orders.Order_Date,\n  Stock_Orders.Delivery_Status\nFROM Stock_Orders\nJOIN Products\n  ON Stock_Orders.Product_ID = Products.Product_ID;`,
      run: (p: Product[], s: Supplier[], o: StockOrder[]) => {
        return {
          columns: ['Order_ID', 'Product_Name', 'Quantity_Ordered', 'Order_Date', 'Delivery_Status'],
          rows: o.map(order => {
            const prod = p.find(prod => prod.Product_ID === order.Product_ID);
            return {
              Order_ID: `#${order.Order_ID}`,
              Product_Name: prod ? prod.Product_Name : `Product #${order.Product_ID}`,
              Quantity_Ordered: order.Quantity_Ordered,
              Order_Date: order.Order_Date,
              Delivery_Status: order.Delivery_Status
            };
          })
        };
      }
    },
    {
      id: 4,
      title: 'Query 4: Display Supplier for each Product (JOIN)',
      description: 'Performs an INNER JOIN between Products and Suppliers to display corresponding manufacturing suppliers.',
      sql: () => `SELECT\n  Products.Product_Name,\n  Suppliers.Supplier_Name\nFROM Products\nJOIN Suppliers\n  ON Products.Supplier_ID = Suppliers.Supplier_ID;`,
      run: (p: Product[], s: Supplier[]) => {
        return {
          columns: ['Product_Name', 'Supplier_Name'],
          rows: p.map(prod => {
            const sup = s.find(sup => sup.Supplier_ID === prod.Supplier_ID);
            return {
              Product_Name: prod.Product_Name,
              Supplier_Name: sup ? sup.Supplier_Name : `Supplier #${prod.Supplier_ID}`
            };
          })
        };
      }
    }
  ];

  const handleRunPresetQuery = () => {
    const activePreset = presetQueries.find(q => q.id === selectedPresetQuery);
    if (!activePreset) return;

    let res;
    let sqlText = '';

    if (selectedPresetQuery === 1) {
      res = activePreset.run(products, suppliers, orders, stockParameter);
      sqlText = activePreset.sql(stockParameter);
    } else if (selectedPresetQuery === 2) {
      res = activePreset.run(products, suppliers, orders, cityParameter);
      sqlText = activePreset.sql(cityParameter);
    } else {
      res = activePreset.run(products, suppliers, orders);
      sqlText = activePreset.sql();
    }

    setExecutedQueryText(sqlText);
    setCustomQueryColumns(res.columns);
    setCustomQueryResult(res.rows);
  };

  const getDraftSql = () => {
    const q = presetQueries.find(item => item.id === selectedPresetQuery);
    if (!q) return '';
    const param = selectedPresetQuery === 1 ? stockParameter : selectedPresetQuery === 2 ? cityParameter : undefined;
    return q.sql(param);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Interactive DBMS Console</h2>
        <p className="text-sm text-slate-500">
          Analyze SQL transactions, study relational queries, and test relational schema outputs in real-time.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveConsoleTab('playground')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeConsoleTab === 'playground'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" /> SQL Query Playground
        </button>
        <button
          onClick={() => setActiveConsoleTab('logs')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer relative ${
            activeConsoleTab === 'logs'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" /> Transaction Tracing Log
          {sqlLogs.length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
              {sqlLogs.length}
            </span>
          )}
        </button>
      </div>

      {/* SQL PLAYGROUND TAB */}
      {activeConsoleTab === 'playground' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Query Selection & Param Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <Code2 className="w-4.5 h-4.5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">Select Schema Query</h3>
            </div>

            <div className="space-y-4">
              {/* Query Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600">Select Academic SQL Preset</label>
                <select
                  value={selectedPresetQuery}
                  onChange={(e) => setSelectedPresetQuery(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {presetQueries.map(q => (
                    <option key={q.id} value={q.id}>{q.title}</option>
                  ))}
                </select>
              </div>

              {/* Dynamic parameters inputs */}
              {selectedPresetQuery === 1 && (
                <div className="space-y-1.5 p-3.5 bg-blue-50/40 rounded-xl border border-blue-100 animate-fadeIn">
                  <label className="block text-xs font-semibold text-blue-800">Assign Threshold (?) Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={stockParameter}
                    onChange={(e) => setStockParameter(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Replaces parameter inside the Stock_Quantity query check.</p>
                </div>
              )}

              {selectedPresetQuery === 2 && (
                <div className="space-y-1.5 p-3.5 bg-blue-50/40 rounded-xl border border-blue-100 animate-fadeIn">
                  <label className="block text-xs font-semibold text-blue-800">Assign Target City (?) name</label>
                  <input
                    type="text"
                    value={cityParameter}
                    onChange={(e) => setCityParameter(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Replaces parameter inside the Suppliers string City constraint.</p>
                </div>
              )}

              {/* Detailed Description */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 leading-normal">
                <span className="font-semibold text-slate-700 block mb-1">Academic Objective:</span>
                {presetQueries.find(q => q.id === selectedPresetQuery)?.description}
              </div>

              <button
                onClick={handleRunPresetQuery}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" /> Execute SQL Query
              </button>
            </div>
          </div>

          {/* SQL Editor Slate & Output Result (Middle/Right) */}
          <div className="xl:col-span-2 space-y-4">
            
            {/* Dark Slate Editor Mockup */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-sm overflow-hidden text-slate-100">
              <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  <span>Interactive_Terminal_Engine.sql</span>
                </div>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-sm text-slate-400">SQL-92 compliant</span>
              </div>
              <div className="p-4 font-mono text-xs md:text-sm text-emerald-400 leading-relaxed whitespace-pre select-all">
                {executedQueryText || getDraftSql()}
              </div>
            </div>

            {/* Live Result Output */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden min-h-60 flex flex-col justify-between">
              <div>
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">DBMS SQL Execution Result Set</span>
                  {customQueryResult !== null && (
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      ✔ Completed ({customQueryResult.length} rows returned)
                    </span>
                  )}
                </div>

                {customQueryResult === null ? (
                  <div className="py-16 text-center text-slate-400 text-xs px-6 flex flex-col items-center justify-center gap-2">
                    <Terminal className="w-8 h-8 text-slate-300" />
                    <div>
                      <p className="font-semibold text-slate-600">Terminal Awaiting Execution...</p>
                      <p className="text-slate-400 mt-0.5">Click "Execute SQL Query" to trace columns and rows matching the relational schema.</p>
                    </div>
                  </div>
                ) : customQueryResult.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs px-6">
                    <p className="font-semibold text-slate-500">Query Executed Successfully</p>
                    <p className="text-slate-400 mt-1">Returned 0 rows (Empty Set). Please try altering query parameters.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {customQueryColumns.map(col => (
                            <th key={col} className="p-3 font-mono">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {customQueryResult.map((row, index) => (
                          <tr key={index} className="hover:bg-slate-50/30">
                            {customQueryColumns.map(col => (
                              <td key={col} className="p-3 font-medium">
                                {typeof row[col] === 'number' ? (
                                  <span className="font-mono text-slate-800 font-bold">{row[col]}</span>
                                ) : (
                                  row[col]
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {customQueryResult !== null && (
                <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 font-medium flex items-center gap-1.5 justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  These results represent live, matching keys and relationships mapped across our local mock relational database.
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* SQL TRANSACTION LOGS TAB */}
      {activeConsoleTab === 'logs' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Dynamic UI Transaction Logs</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  See the exact SQL statements generated automatically in the background as you create, update, and delete records.
                </p>
              </div>
              {sqlLogs.length > 0 && (
                <button
                  onClick={onClearLogs}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors px-3 py-1.5 hover:bg-rose-50 rounded-lg cursor-pointer"
                >
                  Clear Tracing Logs
                </button>
              )}
            </div>

            {sqlLogs.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <Terminal className="w-8 h-8 text-slate-300" />
                <p className="font-semibold text-slate-600">No transactions recorded yet.</p>
                <p className="text-slate-400 mt-0.5 max-w-sm">
                  Go to Suppliers, Products, or Orders screens to trigger CRUD actions. Their SQL translations will log here immediately!
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {sqlLogs.map((log) => (
                  <div key={log.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">{log.description}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-sm font-semibold uppercase tracking-wide">
                          Affected Rows: {log.affectedRows}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">{log.timestamp}</span>
                    </div>
                    <div className="bg-slate-950 p-4 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre select-all border-b border-slate-900">
                      {log.query}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
