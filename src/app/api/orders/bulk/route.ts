import { NextResponse } from 'next/server';
import { getDb, logSqlTrace } from '../../../../lib/db';

export async function POST(req: Request) {
  try {
    const { orders } = await req.json(); // Array of { Product_ID, Quantity_Ordered, Order_Date, Delivery_Status }
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json({ error: 'No orders provided for bulk submission' }, { status: 400 });
    }

    const dbClient = await getDb();
    const statements = orders.map(o => ({
      sql: 'INSERT INTO Stock_Orders (Product_ID, Quantity_Ordered, Order_Date, Delivery_Status) VALUES (?, ?, ?, ?)',
      args: [o.Product_ID, o.Quantity_Ordered, o.Order_Date, o.Delivery_Status]
    }));

    await dbClient.batch(statements);

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

    return NextResponse.json({ success: true, count: productsCount }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
