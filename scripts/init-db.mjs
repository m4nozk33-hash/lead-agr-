import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';

async function main() {
  const db = neon(process.env.DATABASE_URL);
  const statements = readFileSync('schema.sql', 'utf8')
    .split(';')
    .map(x => x.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await db.query(statement);
  }

  console.log('Banco inicializado.');
}

main().catch(error => {
  console.error('Erro ao inicializar o banco:', error);
  process.exit(1);
});
