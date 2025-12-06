import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const runMigrate = async () => {
    // Fallback to default if not set, matching docker-compose
    const connectionString = process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/todo_db';

    const pool = new Pool({
        connectionString,
    });

    const db = drizzle(pool);

    console.log('⏳ Running migrations...');

    const start = Date.now();

    try {
        await migrate(db, { migrationsFolder: 'drizzle' });
        const end = Date.now();
        console.log(`✅ Migrations completed in ${end - start}ms`);
    } catch (err) {
        console.error('❌ Migration failed');
        console.error(err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigrate();
