import { NextResponse } from 'next/server';
import { getDb, logSqlTrace } from '../../../lib/db';

export async function GET() {
  try {
    const dbClient = await getDb();
    const result = await dbClient.execute('SELECT * FROM Stock_Orders ORDER BY Order_ID DESC');
    return NextResponse.json(result.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { Product_ID, Quantity_Ordered, Order_Date, Delivery_Status } = await req.json();

    const dbClient = await getDb();
    const query = 'INSERT INTO Stock_Orders (Product_ID, Quantity_Ordered, Order_Date, Delivery_Status) VALUES (?, ?, ?, ?)';
    const result = await dbClient.execute({
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

    return NextResponse.json(newOrder, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
