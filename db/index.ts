import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.ts';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error(
        "DATABASE_URL is not set. Add it to the .env file at the repository root."
    );
}

export const pool = new Pool({
    connectionString,
    max: 10,
    min: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
});

// Without a listener, Node treats it as unhandled and kills the process.
pool.on("error", (error) => {
    console.error("Postgres pool error:", error);
});

export const db = drizzle({
    client: pool,
    schema 
});
