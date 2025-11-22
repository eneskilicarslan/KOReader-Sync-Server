const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./database');
const userRoutes = require('./routes/users');
const syncRoutes = require('./routes/sync');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Debug Logging (Placed AFTER body-parser so req.body is populated)
const logStream = fs.createWriteStream(path.join(__dirname, 'debug.log'), { flags: 'a' });
app.use((req, res, next) => {
    const log = `[${new Date().toISOString()}] ${req.method} ${req.url} Body:${JSON.stringify(req.body)}\nHeaders: ${JSON.stringify(req.headers)}\n\n`;
    logStream.write(log);
    console.log(log);
    next();
});

// Serve static files for Web UI
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/users', userRoutes);
app.use('/syncs', syncRoutes);

// Web UI API
app.get('/api/books', (req, res) => {
    const sql = `
        SELECT 
            p.document_hash, 
            p.timestamp as last_synced, 
            json_extract(p.metadata, '$.title') as title,
            json_extract(p.metadata, '$.authors') as authors,
            json_extract(p.metadata, '$.cover_url') as cover_url,
            p.percentage,
            p.device
        FROM progress p
        INNER JOIN (
            SELECT document_hash, MAX(timestamp) as max_timestamp
            FROM progress
            WHERE device != 'WebAdmin'
            GROUP BY document_hash
        ) latest ON p.document_hash = latest.document_hash AND p.timestamp = latest.max_timestamp
        ORDER BY p.timestamp DESC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});



// Update book metadata (Title/Author/Cover) AND/OR Progress (Percentage)
app.put('/api/books/:document_hash', (req, res) => {
    const { document_hash } = req.params;
    const { title, authors, cover_url, percentage } = req.body;

    if (!title && !authors && !cover_url && percentage === undefined) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    const sqlGet = `SELECT * FROM progress WHERE document_hash = ? ORDER BY timestamp DESC LIMIT 1`;

    db.get(sqlGet, [document_hash], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Book not found' });

        // 1. Update Metadata (Title, Author, Cover)
        let metadata = {};
        try {
            metadata = JSON.parse(row.metadata || '{}');
        } catch (e) {
            metadata = {};
        }

        if (title) metadata.title = title;
        if (authors) metadata.authors = authors;
        if (cover_url) metadata.cover_url = cover_url;

        // Update metadata for the existing latest row (to keep display consistent)
        // OR for all rows? For now, let's update the latest row so the UI reflects it immediately.
        const sqlUpdateMeta = `UPDATE progress SET metadata = ? WHERE id = ?`;
        db.run(sqlUpdateMeta, [JSON.stringify(metadata), row.id], function (err) {
            if (err) console.error('Error updating metadata:', err);
        });

        // 2. Create NEW Progress Entry if percentage changed
        if (percentage !== undefined && percentage !== '') {
            const newPercentage = parseFloat(percentage) / 100; // Convert 50 to 0.5
            // Add a 1-hour buffer to ensure this timestamp is always newer than any Kindle sync
            const timestamp = Date.now() + (60 * 60 * 1000); // 1 hour in the future




            // We reuse the existing progress_hash/page/epub_cfi because we don't know the real values for the new position.
            // This is a "hack" to force the percentage update. The Kindle might get confused about the exact page, 
            // but it should respect the percentage for the progress bar.
            const sqlInsert = `
                INSERT INTO progress (user_id, document_hash, progress_hash, timestamp, device, percentage, page, epub_cfi, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.run(sqlInsert, [
                row.user_id,
                document_hash,
                row.progress_hash, // Reusing old hash (not ideal but necessary)
                timestamp,
                'WebAdmin',
                newPercentage,
                row.page, // Reusing old page
                row.epub_cfi, // Reusing old CFI
                JSON.stringify(metadata) // Use updated metadata
            ], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ status: 'updated', metadata, new_progress: true });
            });
        } else {
            res.json({ status: 'updated', metadata });
        }
    });
});

// Delete a book (Superadmin)
app.delete('/api/books/:document_hash', (req, res) => {
    const { document_hash } = req.params;
    db.run('DELETE FROM progress WHERE document_hash = ?', [document_hash], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: 'deleted', changes: this.changes });
    });
});

// Rename device (Superadmin)
app.put('/api/devices/rename', (req, res) => {
    const { old_name, new_name } = req.body;
    if (!old_name || !new_name) return res.status(400).json({ error: 'Old and new names required' });

    db.run('UPDATE progress SET device = ? WHERE device = ?', [new_name, old_name], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: 'updated', changes: this.changes });
    });
});

// Debug Sync Fetch
app.get('/api/debug/fetch/:document_hash', (req, res) => {
    const { document_hash } = req.params;
    // Simulate what the device would get
    const sql = `SELECT * FROM progress WHERE document_hash = ? ORDER BY timestamp DESC LIMIT 1`;
    db.get(sql, [document_hash], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'No data found' });

        // Return raw row data for inspection
        res.json(row);
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
