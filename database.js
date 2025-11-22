const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'koreader.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Progress table
        // Note: KOReader sync protocol details might vary, but we store the core fields.
        // We use a composite primary key or just allow multiple entries and query the latest?
        // KOReader usually updates the same entry or sends a new one.
        // For simplicity, we'll store a history or just the latest state per doc per user.
        // Let's store history but index for quick retrieval of latest.
        db.run(`CREATE TABLE IF NOT EXISTS progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            document_hash TEXT NOT NULL,
            progress_hash TEXT,
            timestamp INTEGER NOT NULL,
            device TEXT,
            percentage REAL,
            page TEXT,
            epub_cfi TEXT,
            metadata TEXT, -- JSON string for extra details like title, author
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);

        // Index for faster retrieval of latest progress
        db.run(`CREATE INDEX IF NOT EXISTS idx_progress_user_doc_time 
                ON progress (user_id, document_hash, timestamp DESC)`);
    });
}

module.exports = db;
