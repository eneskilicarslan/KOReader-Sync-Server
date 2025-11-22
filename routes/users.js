const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database');

// Register a new user
// POST /users/create
router.post('/create', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (username, password_hash) VALUES (?, ?)';

        db.run(sql, [username, hash], function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: 'Username already exists' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({
                id: this.lastID,
                username: username,
                message: 'User created successfully'
            });
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Authenticate user (Login)
// POST /users/auth (Standard)
router.post('/auth', (req, res) => {
    const { username, password } = req.body;
    authenticate(username, password, res);
});

// GET /users/auth (KOReader specific)
router.get('/auth', (req, res) => {
    const username = req.headers['x-auth-user'];
    const password = req.headers['x-auth-key'];
    authenticate(username, password, res);
});

function authenticate(username, password, res) {
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const sql = 'SELECT * FROM users WHERE username = ?';
    db.get(sql, [username], async (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(password, row.password_hash);
        if (match) {
            res.json({
                id: row.id,
                username: row.username,
                authorized: true
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
}

module.exports = router;
