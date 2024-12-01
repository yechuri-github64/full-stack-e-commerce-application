const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  password: String(process.env.DB_PASSWORD),
  port: process.env.DB_PORT || 5432,
  database: 'postgres', // Connect to the 'postgres' database for maintenance tasks
});

const log = (message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

const requiredEnvVars = ['DB_USER', 'DB_HOST', 'DB_PASSWORD', 'DB_PORT', 'DB_NAME', 'TEST_DB_NAME'];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Environment variable ${varName} is not set.`);
    process.exit(1);
  }
});

const terminateConnections = async (dbName) => {
  const client = await pool.connect();
  try {
    // Terminate all connections to the database
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
        AND pg_stat_activity.pid <> pg_backend_pid();
    `, [dbName]);
    log(`Terminated all connections to database "${dbName}".`);
  } catch (err) {
    console.error(`Error terminating connections for database "${dbName}":`, err.message);
  } finally {
    client.release();
  }
};

const dropDatabaseIfExists = async (dbName) => {
  const client = await pool.connect();
  try {
    // Terminate any active connections before dropping the database
    await terminateConnections(dbName);
    await client.query(`DROP DATABASE IF EXISTS ${dbName};`);
    log(`Database "${dbName}" dropped if it existed.`);
  } catch (err) {
    console.error(`Error dropping database "${dbName}":`, err.message);
  } finally {
    client.release();
  }
};

const executeSQLFile = async (dbName, filePaths) => {
  const client = await pool.connect();
  try {
    // Ensure the target database is ready for the schema files
    const dbPool = new Pool({ ...pool.options, database: dbName });
    const dbClient = await dbPool.connect();

    // Execute all the SQL files
    for (const filePath of filePaths) {
      const sql = fs.readFileSync(filePath, 'utf8');
      await dbClient.query(sql);
      log(`Executed ${path.basename(filePath)} for "${dbName}"`);
    }

    await dbClient.end();
  } catch (err) {
    console.error(`Error with database "${dbName}":`, err.message);
  } finally {
    client.release();
  }
};

const setupDatabases = async () => {
  try {
    const schemaFiles = [
      path.join(__dirname, 'database', 'enums.sql'),
      path.join(__dirname, 'database', 'users.sql'),
      path.join(__dirname, 'database', 'products.sql'),
      path.join(__dirname, 'database', 'orders.sql'),
      path.join(__dirname, 'database', 'order_items.sql'),
      path.join(__dirname, 'database', 'triggers.sql'),
      path.join(__dirname, 'database', 'indexes.sql'),
    ];

    // Drop the databases first (connect to 'postgres' to avoid dropping the current DB)
    await dropDatabaseIfExists(process.env.DB_NAME);
    await dropDatabaseIfExists(process.env.TEST_DB_NAME);

    // Now create and execute SQL files for both databases
    await executeSQLFile(process.env.DB_NAME, schemaFiles);
    await executeSQLFile(process.env.TEST_DB_NAME, schemaFiles);

    log('All databases set up successfully!');
    pool.end();
  } catch (err) {
    console.error('Error setting up databases:', err);
    process.exit(1);
  }
};

setupDatabases();
