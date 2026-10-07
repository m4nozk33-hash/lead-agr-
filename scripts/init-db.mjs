import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
const db = neon(process.env.DATABASE_URL);
for (const s of readFileSync('schema.sql','utf8').split(';').map(x=>x.trim()).filter(Boolean)) await db.query(s);
console.log('Banco inicializado.');
