import { NextResponse } from 'next/server';
import { getDb, logSqlTrace } from '../../../../lib/db';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    const { Product_ID, Quantity_Ordered, Order_Date, Delivery_Status } = await req.json();

    const dbClient = await getDb();

    // 1. Get previous order state
    const prevResult = await dbClient.execute({
      sql: 'SELECT * FROM Stock_Orders WHERE Order_ID = ?',
      args: [orderId]
    });
    
    if (prevResult.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const previousOrder = prevResult.rows[0];
    const prevStatus = previousOrder.Delivery_Status;
    
    let stockAdjustmentMsg = '';

    // 2. Perform SQLite transaction/batch for order update and potential product stock triggers
    if (prevStatus !== 'Delivered' && Delivery_Status === 'Delivered') {
      // Stock arrived trigger
      await dbClient.batch([
        {
          sql: 'UPDATE Stock_Orders SET Delivery_Status = ? WHERE Order_ID = ?',
          args: [Delivery_Status, orderId]
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
      await dbClient.execute({
        sql: 'UPDATE Stock_Orders SET Product_ID = ?, Quantity_Ordered = ?, Order_Date = ?, Delivery_Status = ? WHERE Order_ID = ?',
        args: [parseInt(Product_ID, 10), parseInt(Quantity_Ordered, 10), Order_Date, Delivery_Status, orderId]
      });
    }

    await logSqlTrace(
      `UPDATE Stock_Orders\nSET Product_ID = ${Product_ID}, Quantity_Ordered = ${Quantity_Ordered}, Order_Date = '${Order_Date}', Delivery_Status = '${Delivery_Status}'\nWHERE Order_ID = ${orderId};`,
      `Saved details for Order #${orderId}.${stockAdjustmentMsg}`,
      1
    );

    return NextResponse.json({
      Order_ID: orderId,
      Product_ID: parseInt(Product_ID, 10),
      Quantity_Ordered: parseInt(Quantity_Ordered, 10),
      Order_Date,
      Delivery_Status,
      stockAdjustmentMsg
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
    const orderId = parseInt(id, 10);

    const dbClient = await getDb();
    await dbClient.execute({
      sql: 'DELETE FROM Stock_Orders WHERE Order_ID = ?',
      args: [orderId]
    });

    await logSqlTrace(
      `DELETE FROM Stock_Orders WHERE Order_ID = ${orderId};`,
      `Deleted stock order #${orderId}`,
      1
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
