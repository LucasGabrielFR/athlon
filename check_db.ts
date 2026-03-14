
import 'dotenv/config';
import { db } from './src/db';
import { organizations } from './src/db/schema';

async function check() {
  try {
    const result = await db.query.organizations.findMany();
    console.log('Success:', result.length, 'records found');
    process.exit(0);
  } catch (e) {
    console.error('FAILED:', e);
    process.exit(1);
  }
}

check();
