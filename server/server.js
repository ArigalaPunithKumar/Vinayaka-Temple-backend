require('dotenv').config(); // Load environment variables

const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        process.exit(1); // Stop server if DB fails
    }
    console.log('Connected to MySQL database');
});


// ================= AUTH ROUTES =================

// Register
app.post('/api/register', (req, res) => {
    const { fullname, email, password } = req.body;

    if (!fullname || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const query = 'INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)';

    db.query(query, [fullname, email, password], (err) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Email is already registered' });
            }
            return res.status(500).json({ error: 'Database error' });
        }

        res.status(201).json({ message: 'Registration successful' });
    });
});


// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT fullname, email FROM users WHERE email = ? AND password = ?';

    db.query(query, [email, password], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        res.json({
            message: 'Login successful',
            user: results[0]
        });
    });
});


// ================= BOOKING ROUTES =================

// Book seva
app.post('/api/book', (req, res) => {
    const { email, seva, date } = req.body;

    if (!email || !seva || !date) {
        return res.status(400).json({ error: 'Missing booking details' });
    }

    const query = 'INSERT INTO bookings (email, seva, date) VALUES (?, ?, ?)';

    db.query(query, [email, seva, date], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        res.status(201).json({ message: 'Booking confirmed successfully' });
    });
});


// Fetch bookings by email
app.get('/api/bookings/:email', (req, res) => {
    const { email } = req.params;

    const query = 'SELECT * FROM bookings WHERE email = ? ORDER BY date DESC';

    db.query(query, [email], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        res.json(results);
    });
});


// ================= FRONTEND ROUTE =================

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});