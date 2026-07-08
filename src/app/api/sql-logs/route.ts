import { NextResponse } from 'next/server';
import { getDb, logSqlTrace } from '../../../lib/db';

export async function GET() {
  try {
    const dbClient = await getDb();
    const result = await dbClient.execute('SELECT * FROM Sql_Logs ORDER BY timestamp DESC LIMIT 100');
    return NextResponse.json(result.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { query, description, affectedRows } = await req.json();
    await logSqlTrace(query || '', description || '', affectedRows || 0);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const dbClient = await getDb();
    await dbClient.execute('DELETE FROM Sql_Logs');
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
