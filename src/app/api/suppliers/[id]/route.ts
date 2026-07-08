import { NextResponse } from 'next/server';
import { getDb, logSqlTrace } from '../../../../lib/db';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supplierId = parseInt(id, 10);
    const { Supplier_Name, Contact_Person, City } = await req.json();

    const dbClient = await getDb();
    const query = 'UPDATE Suppliers SET Supplier_Name = ?, Contact_Person = ?, City = ? WHERE Supplier_ID = ?';
    await dbClient.execute({
      sql: query,
      args: [Supplier_Name, Contact_Person, City, supplierId]
    });

    await logSqlTrace(
      `UPDATE Suppliers\nSET Supplier_Name = '${Supplier_Name}', Contact_Person = '${Contact_Person}', City = '${City}'\nWHERE Supplier_ID = ${supplierId};`,
      `Updated supplier details for "${Supplier_Name}"`,
      1
    );

    return NextResponse.json({ Supplier_ID: supplierId, Supplier_Name, Contact_Person, City });
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
    const supplierId = parseInt(id, 10);

    const dbClient = await getDb();
    
    // Foreign key constraint check
    const checkProducts = await dbClient.execute({
      sql: 'SELECT COUNT(*) as count FROM Products WHERE Supplier_ID = ?',
      args: [supplierId]
    });
    const productCount = Number(checkProducts.rows[0].count);

    if (productCount > 0) {
      return NextResponse.json({
        error: `[FOREIGN KEY CONSTRAINT VIOLATION]: Cannot delete supplier because ${productCount} products belong to it.`
      }, { status: 400 });
    }

    await dbClient.execute({
      sql: 'DELETE FROM Suppliers WHERE Supplier_ID = ?',
      args: [supplierId]
    });

    await logSqlTrace(
      `DELETE FROM Suppliers WHERE Supplier_ID = ${supplierId};`,
      `Deleted supplier ID ${supplierId}`,
      1
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
