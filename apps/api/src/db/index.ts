import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

// Singleton para o pool de conexões para evitar abrir múltiplas conexões durante o Hot Reload (HMR) em desenvolvimento.
const poolConnection = mysql.createPool(process.env.DATABASE_URL!);

export const db = drizzle(poolConnection, { schema, mode: 'default' });
