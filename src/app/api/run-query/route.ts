import { NextResponse } from 'next/server';
import { getDb, logSqlTrace } from '../../../lib/db';

export async function POST(req: Request) {
  try {
    const { query, params } = await req.json();
    if (!query) {
      return NextResponse.json({ error: 'No SQL query provided' }, { status: 400 });
    }

    const dbClient = await getDb();
    const result = await dbClient.execute({ sql: query, args: params || [] });

    // Log manual custom playground execution to the trace log
    await logSqlTrace(
      query,
      `Playground custom query execution`,
      result.rows?.length || 0
    );

    return NextResponse.json({
      success: true,
      columns: result.columns || [],
      rows: result.rows || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
