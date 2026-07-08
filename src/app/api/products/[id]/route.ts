import { NextResponse } from 'next/server';
import { getDb, logSqlTrace } from '../../../../lib/db';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    const { Product_Name, Category, Unit_Price, Stock_Quantity, Supplier_ID } = await req.json();

    const dbClient = await getDb();
    const query = 'UPDATE Products SET Product_Name = ?, Category = ?, Unit_Price = ?, Stock_Quantity = ?, Supplier_ID = ? WHERE Product_ID = ?';
    await dbClient.execute({
      sql: query,
      args: [Product_Name, Category, parseFloat(Unit_Price), parseInt(Stock_Quantity, 10), parseInt(Supplier_ID, 10), productId]
    });

    await logSqlTrace(
      `UPDATE Products\nSET Product_Name = '${Product_Name}', Category = '${Category}', Unit_Price = ${Unit_Price}, Stock_Quantity = ${Stock_Quantity}, Supplier_ID = ${Supplier_ID}\nWHERE Product_ID = ${productId};`,
      `Updated catalog details for "${Product_Name}"`,
      1
    );

    return NextResponse.json({
      Product_ID: productId,
      Product_Name,
      Category,
      Unit_Price: parseFloat(Unit_Price),
      Stock_Quantity: parseInt(Stock_Quantity, 10),
      Supplier_ID: parseInt(Supplier_ID, 10)
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);

    const dbClient = await getDb();

    // Foreign key constraint check
    const checkOrders = await dbClient.execute({
      sql: 'SELECT COUNT(*) as count FROM Stock_Orders WHERE Product_ID = ?',
      args: [productId]
    });
    const orderCount = Number(checkOrders.rows[0].count);

    if (orderCount > 0) {
      return NextResponse.json({
        error: `[FOREIGN KEY CONSTRAINT VIOLATION]: Cannot delete product because ${orderCount} Stock Orders reference it.`
      }, { status: 400 });
    }

    await dbClient.execute({
      sql: 'DELETE FROM Products WHERE Product_ID = ?',
      args: [productId]
    });

    await logSqlTrace(
      `DELETE FROM Products WHERE Product_ID = ${productId};`,
      `Deleted product ID ${productId}`,
      1
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
