import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;

// Disable prefetch as it is not supported for "Transaction" pool mode
const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql);

async function main() {
  console.log('Запуск миграции...');
  
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Миграция успешно применена!');
  } catch (error) {
    console.error('Ошибка миграции:', error);
  }
  
  await sql.end();
}

main();
