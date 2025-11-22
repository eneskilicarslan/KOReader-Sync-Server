const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcrypt');

// Helper function to authenticate request
function authenticateRequest(req, res, callback) {
    let username, password;

    console.log('Authenticating request...');
    console.log('Headers:', req.headers);

    // Check for KOReader headers first
    if (req.headers['x-auth-user'] && req.headers['x-auth-key']) {
        username = req.headers['x-auth-user'];
        password = req.headers['x-auth-key'];
        console.log('Using KOReader headers:', username);
    }
    // Fallback to Basic Auth
    else if (req.headers.authorization) {
        const auth = new Buffer.from(req.headers.authorization.split(' ')[1], 'base64').toString().split(':');
        username = auth[0];
        password = auth[1];
        console.log('Using Basic Auth:', username);
    } else {
        console.log('No authorization provided');
        return res.status(401).json({ error: 'No authorization provided' });
    }

    db.get('SELECT id, password_hash FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
            console.error('Database error during auth:', err);
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            console.log('User not found:', username);
            return res.status(401).json({ error: 'Invalid user' });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            console.log('Password mismatch for user:', username);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('Authentication successful for:', username);
        callback(user);
    });
}

// Update progress
// PUT /syncs/progress
router.put('/progress', (req, res) => {
    authenticateRequest(req, res, (user) => {
        console.log('Processing progress update for user:', user.id);
        console.log('Body:', req.body);

        const { document, progress, timestamp, device, percentage, page, epub_cfi } = req.body;

        // Use current time if timestamp is missing
        const ts = timestamp || Date.now();

        // Get existing metadata to preserve title, author, cover
        const sqlGetExisting = `SELECT metadata FROM progress WHERE user_id = ? AND document_hash = ? ORDER BY timestamp DESC LIMIT 1`;

        db.get(sqlGetExisting, [user.id, document], (err, existingRow) => {
            let metadata = {};

            // If there's existing metadata, parse and preserve it
            if (existingRow && existingRow.metadata) {
                try {
                    const existing = JSON.parse(existingRow.metadata);
                    // Preserve title, authors, and cover_url from existing metadata
                    if (existing.title) metadata.title = existing.title;
                    if (existing.authors) metadata.authors = existing.authors;
                    if (existing.cover_url) metadata.cover_url = existing.cover_url;
                } catch (e) {
                    console.log('Could not parse existing metadata:', e);
                }
            }

            // Merge with any new metadata from the request (though KOReader doesn't send this)
            Object.assign(metadata, req.body);

            const sql = `INSERT INTO progress (user_id, document_hash, progress_hash, timestamp, device, percentage, page, epub_cfi, metadata)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            db.run(sql, [user.id, document, progress, ts, device, percentage, page, epub_cfi, JSON.stringify(metadata)], function (err) {
                if (err) {
                    console.error('SQL Error:', err.message);
                    return res.status(500).json({ error: err.message });
                }
                console.log('Progress updated successfully, metadata preserved');
                res.json({
                    document: document,
                    timestamp: ts,
                    status: 'updated'
                });
            });
        });
    });
});


// Get progress for a document
// GET /syncs/progress/:document
router.get('/progress/:document', (req, res) => {
    authenticateRequest(req, res, (user) => {
        const documentHash = req.params.document;
        console.log('\n=== KINDLE PULLING PROGRESS ===');
        console.log('User:', user.id);
        console.log('Document hash:', documentHash);

        const sql = `SELECT * FROM progress 
                     WHERE user_id = ? AND document_hash = ? 
                     ORDER BY timestamp DESC LIMIT 1`;

        db.get(sql, [user.id, documentHash], (err, row) => {
            if (err) {
                console.error('Error fetching progress:', err);
                return res.status(500).json({ error: err.message });
            }

            if (!row) {
                console.log('No progress found for this document');
                console.log('=================================\n');
                return res.json({}); // No progress found, return empty object
            }

            const response = {
                document: row.document_hash,
                progress: row.progress_hash,
                timestamp: row.timestamp,
                device: row.device,
                percentage: row.percentage,
                page: row.page,
                epub_cfi: row.epub_cfi
            };

            console.log('Sending progress to Kindle:');
            console.log('  - Percentage:', (row.percentage * 100).toFixed(1) + '%');
            console.log('  - Device:', row.device);
            console.log('  - Timestamp:', new Date(row.timestamp).toLocaleString());
            console.log('  - Full response:', JSON.stringify(response, null, 2));
            console.log('=================================\n');

            res.json(response);
        });
    });
});

module.exports = router;
