// Creates the application database if it doesn't exist.
// Uses the DATABASE_URL from .env to determine the database name,
// then connects to the default 'postgres' database to create it.

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Parse .env file manually (no dotenv dependency needed)
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('ERROR: .env file not found. Please create one from .env.example');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

async function createDatabase() {
  loadEnv();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL not set in .env');
    process.exit(1);
  }

  // Parse the database name from the URL
  const url = new URL(databaseUrl);
  const dbName = url.pathname.slice(1).split('?')[0]; // Remove leading / and query params

  if (!dbName || dbName === 'postgres') {
    console.log('Using default postgres database, no creation needed.');
    return;
  }

  // Connect to the default 'postgres' database to create the target database
  url.pathname = '/postgres';
  const adminConnectionString = url.toString().split('?')[0];

  const client = new Client({ connectionString: adminConnectionString });

  try {
    await client.connect();

    // Check if database exists
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (result.rows.length > 0) {
      console.log(`Database "${dbName}" already exists.`);
    } else {
      // Database names can't be parameterized, but we validated it from the URL
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" created successfully.`);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('ERROR: Could not connect to PostgreSQL. Make sure it is running.');
    } else if (error.code === '28P01') {
      console.error('ERROR: Authentication failed. Check your DATABASE_URL credentials in .env');
    } else {
      console.error('ERROR creating database:', error.message);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();
