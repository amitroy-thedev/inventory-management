import { NextResponse } from 'next/server';
import { getDb, logSqlTrace } from '../../../lib/db';

export async function GET() {
  try {
    const dbClient = await getDb();
    const result = await dbClient.execute('SELECT * FROM Products ORDER BY Product_ID ASC');
    return NextResponse.json(result.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { Product_Name, Category, Unit_Price, Stock_Quantity, Supplier_ID } = await req.json();

    const dbClient = await getDb();
    const query = 'INSERT INTO Products (Product_Name, Category, Unit_Price, Stock_Quantity, Supplier_ID) VALUES (?, ?, ?, ?, ?)';
    const result = await dbClient.execute({
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

    return NextResponse.json(newProduct, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
