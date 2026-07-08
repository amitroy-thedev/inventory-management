import { NextResponse } from 'next/server';
import { getDb, logSqlTrace } from '../../../lib/db';

export async function GET() {
  try {
    const dbClient = await getDb();
    const result = await dbClient.execute('SELECT * FROM Suppliers ORDER BY Supplier_ID ASC');
    return NextResponse.json(result.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { Supplier_Name, Contact_Person, City } = await req.json();
    if (!Supplier_Name || !Contact_Person || !City) {
      return NextResponse.json({ error: 'Missing required supplier fields' }, { status: 400 });
    }

    const dbClient = await getDb();
    const query = 'INSERT INTO Suppliers (Supplier_Name, Contact_Person, City) VALUES (?, ?, ?)';
    const result = await dbClient.execute({
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

    return NextResponse.json(newSupplier, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
