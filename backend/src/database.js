const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH || './data/database.sqlite';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Companies table
    db.run(`
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        contact_person TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Projects table
    db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        company_id INTEGER,
        client_name TEXT,
        hourly_rate REAL DEFAULT 0,
        fixed_price REAL DEFAULT 0,
        pricing_type TEXT DEFAULT 'hourly',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id)
      )
    `);

    // Tasks table
    db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        company_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        amount REAL DEFAULT 0,
        rate_type TEXT DEFAULT 'spot',
        status TEXT DEFAULT 'pending',
        invoice_status TEXT DEFAULT 'not_invoiced',
        due_date DATE,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (company_id) REFERENCES companies(id)
      )
    `);

    // Add new columns if they don't exist (for existing databases)
    db.run(`ALTER TABLE tasks ADD COLUMN company_id INTEGER REFERENCES companies(id)`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        // Column already exists, ignore
      }
    });
    db.run(`ALTER TABLE tasks ADD COLUMN rate_type TEXT DEFAULT 'spot'`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        // Column already exists, ignore
      }
    });

    // Time entries table
    db.run(`
      CREATE TABLE IF NOT EXISTS time_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        duration_minutes INTEGER NOT NULL,
        description TEXT,
        started_at DATETIME,
        ended_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `);

    // Invoices table
    db.run(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER,
        project_id INTEGER,
        invoice_number TEXT UNIQUE,
        total_amount REAL NOT NULL,
        issue_date DATE NOT NULL,
        due_date DATE,
        status TEXT DEFAULT 'draft',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id),
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )
    `);

    // Invoice items table (links tasks to invoices)
    db.run(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        task_id INTEGER,
        description TEXT NOT NULL,
        quantity REAL DEFAULT 1,
        unit_price REAL NOT NULL,
        amount REAL NOT NULL,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES tasks(id)
      )
    `);

    console.log('Database tables initialized');
  });
}

module.exports = db;
