
import 'dotenv/config';
import { db } from './src/db';
import { competitions } from './src/db/schema';
import { desc } from 'drizzle-orm';

async function check() {
  try {
    const result = await db.query.competitions.findFirst({
      orderBy: [desc(competitions.id)]
    });
    console.log('Latest Competition:', JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('FAILED:', e);
    process.exit(1);
  }
}

check();
