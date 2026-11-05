const env = require('./env');

let pool = null;

if (env.hasSupabaseKeys) {
  // If Supabase/PostgreSQL URL is provided in .env
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.SUPABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  console.log('[Database]: Connected to PostgreSQL / Supabase pool.');
} else {
  console.log('[Database]: Supabase keys not set. Running in resilient local memory mode.');
}

const memoryStore = {
  projects: new Map(),
  clips: new Map()
};

const db = {
  async query(text, params) {
    if (pool) {
      return pool.query(text, params);
    }
    // Fallback simulation for offline MVP testing
    return { rows: [] };
  },
  memoryStore
};

module.exports = db;
