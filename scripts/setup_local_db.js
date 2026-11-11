const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const adminClient = new Client({ connectionString: 'postgresql://postgres:admin123@localhost:5432/postgres' });
  await adminClient.connect();
  
  // Create roles if not exist
  await adminClient.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon; END IF;
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated; END IF;
    END $$;
  `);

  const dbCheck = await adminClient.query("SELECT 1 FROM pg_database WHERE datname='hospital'");
  if (dbCheck.rowCount === 0) {
    await adminClient.query('CREATE DATABASE hospital');
    console.log('✅ Created database "hospital"');
  } else {
    console.log('ℹ️ Database "hospital" already exists');
  }
  await adminClient.end();

  const hospitalClient = new Client({ connectionString: 'postgresql://postgres:admin123@localhost:5432/hospital' });
  await hospitalClient.connect();

  // Create auth schema & users table matching Supabase
  await hospitalClient.query(`
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE IF NOT EXISTS auth.users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT
    );
  `);
  console.log('✅ Created auth schema and auth.users table');

  const scripts = [
    'database/01_esquema_hospital.sql',
    'database/02_seed_roles.sql',
    'database/03_seed_catalogos_demo_OPCIONAL.sql',
    'database/04_seguridad_rls.sql',
    'database/06_indices_adicionales_OPCIONAL.sql'
  ];

  for (const s of scripts) {
    const fullPath = path.resolve(s);
    if (fs.existsSync(fullPath)) {
      console.log(`Executing ${s}...`);
      const sql = fs.readFileSync(fullPath, 'utf8');
      try {
        await hospitalClient.query(sql);
        console.log(`✅ Success: ${s}`);
      } catch (err) {
        console.error(`⚠️ Error in ${s}:`, err.message);
      }
    }
  }

  const tables = await hospitalClient.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  console.log('Tables created:', tables.rows.map(r => r.table_name));

  await hospitalClient.end();
}

run().catch(console.error);
