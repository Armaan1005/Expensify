const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'file://'],
    credentials: true
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    if (req.method === 'POST' || req.method === 'PATCH') {
        console.log('Request Body:', req.body);
    }
    next();
});

app.use(express.static('.'));

// Initialize TWO SEPARATE SQLite databases
const personalDB = new sqlite3.Database('./personal_expenses.db', (err) => {
    if (err) {
        console.error('Error opening personal database:', err.message);
    } else {
        console.log('✅ Connected to PERSONAL database.');
        
        // Create expenses table for personal tracker
        personalDB.run(`CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            user_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating personal expenses table:', err.message);
            } else {
                console.log('Personal expenses table ready.');
            }
        });
        
        // Create money_received table for personal tracker
        personalDB.run(`CREATE TABLE IF NOT EXISTS money_received (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT NOT NULL,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            user_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating money_received table:', err.message);
            } else {
                console.log('Money received table ready.');
            }
        });
    }
});

const corporateDB = new sqlite3.Database('./corporate_expenses.db', (err) => {
    if (err) {
        console.error('Error opening corporate database:', err.message);
    } else {
        console.log('✅ Connected to CORPORATE database.');
        
        // Create expenses table for corporate tracker
        corporateDB.run(`CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            user_id TEXT NOT NULL,
            submitted_by TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            approved_by TEXT,
            approval_date DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating corporate expenses table:', err.message);
            } else {
                console.log('Corporate expenses table ready.');
            }
        });
        
        // Create users table for corporate tracker (with roles)
        corporateDB.run(`CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('employee', 'admin')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating corporate users table:', err.message);
            } else {
                console.log('Corporate users table ready.');
            }
        });
    }
});

// Helper function to get the correct database
function getDB(trackerType) {
    return trackerType === 'company' ? corporateDB : personalDB;
}

// Routes

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// GET all expenses (requires tracker_type query param)
app.get('/expense', (req, res) => {
    const trackerType = req.query.tracker_type || 'personal';
    const username = req.query.username; // Get username from query params
    const db = getDB(trackerType);
    
    let sql, params;
    
    // For personal tracker, filter by username to show only user's expenses
    if (trackerType === 'personal' && username) {
        sql = 'SELECT * FROM expenses WHERE user_id = ? ORDER BY created_at DESC';
        params = [username];
        console.log(`Fetching expenses for user: ${username} from ${trackerType} database`);
    } else {
        // For company tracker or when no username specified, return all
        sql = 'SELECT * FROM expenses ORDER BY created_at DESC';
        params = [];
        console.log(`Fetching all expenses from ${trackerType} database`);
    }
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Error fetching expenses:', err.message);
            res.status(500).json({ error: 'Failed to fetch expenses' });
        } else {
            console.log(`Fetched ${rows.length} expenses from ${trackerType} database`);
            res.json(rows);
        }
    });
});

// POST new expense
app.post('/expense', (req, res) => {
    console.log('POST /expense received');
    
    const { name, amount, category, date, user_id, tracker_type, submitted_by, status } = req.body;
    
    console.log('Extracted fields:', { name, amount, category, date, user_id, tracker_type, submitted_by, status });
    
    // Validate required fields
    if (!name || !amount || !category || !date || !user_id || !tracker_type) {
        console.log('Validation failed - missing fields');
        return res.status(400).json({ 
            error: 'All fields are required',
            received: { name, amount, category, date, user_id, tracker_type }
        });
    }
    
    const db = getDB(tracker_type);
    
    let sql, params;
    
    if (tracker_type === 'company') {
        // Corporate tracker: include status and approval fields
        sql = 'INSERT INTO expenses (name, amount, category, date, user_id, submitted_by, status) VALUES (?, ?, ?, ?, ?, ?, ?)';
        params = [
            name, 
            parseFloat(amount), 
            category, 
            date,
            user_id,
            submitted_by || user_id,
            status || 'pending'
        ];
    } else {
        // Personal tracker: simpler schema, auto-approved
        sql = 'INSERT INTO expenses (name, amount, category, date, user_id) VALUES (?, ?, ?, ?, ?)';
        params = [
            name, 
            parseFloat(amount), 
            category, 
            date,
            user_id
        ];
    }
    
    console.log(`Inserting into ${tracker_type} database:`, sql);
    console.log('With params:', params);
    
    db.run(sql, params, function(err) {
        if (err) {
            console.error('Database error:', err.message);
            res.status(500).json({ error: 'Failed to add expense', details: err.message });
        } else {
            console.log(`✅ Successfully added expense with ID: ${this.lastID} to ${tracker_type} database`);
            res.json({ 
                id: this.lastID, 
                message: 'Expense added successfully',
                expense: { id: this.lastID, name, amount: parseFloat(amount), category, date }
            });
        }
    });
});

// DELETE expense (requires tracker_type query param)
app.delete('/expense', (req, res) => {
    console.log('=== DELETE REQUEST RECEIVED ===');
    
    const id = req.query.id;
    const trackerType = req.query.tracker_type || 'personal';
    
    console.log('Expense ID to delete:', id);
    console.log('Tracker type:', trackerType);
    
    if (!id) {
        console.log('ERROR: No ID provided');
        return res.status(400).json({ error: 'ID is required' });
    }
    
    const db = getDB(trackerType);
    const sql = 'DELETE FROM expenses WHERE id = ?';
    
    db.run(sql, [id], function(err) {
        if (err) {
            console.error('Database error during deletion:', err.message);
            res.status(500).json({ error: 'Failed to delete expense', details: err.message });
        } else {
            if (this.changes === 0) {
                console.log('No expense found with ID:', id);
                res.status(404).json({ error: 'Expense not found', id: id });
            } else {
                console.log(`✅ Successfully deleted expense with ID: ${id} from ${trackerType} database`);
                res.json({ 
                    message: 'Expense deleted successfully',
                    deletedId: id,
                    changes: this.changes
                });
            }
        }
    });
});

// PATCH expense status (approve/reject) - Corporate only
app.patch('/expense/:id/status', (req, res) => {
    console.log('=== PATCH EXPENSE STATUS ===');
    const id = req.params.id;
    const { status, approved_by } = req.body;
    
    console.log('Expense ID:', id);
    console.log('New status:', status);
    console.log('Approved by:', approved_by);
    
    if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Valid status required (approved or rejected)' });
    }
    
    // Only corporate database has status field
    const sql = 'UPDATE expenses SET status = ?, approved_by = ?, approval_date = CURRENT_TIMESTAMP WHERE id = ?';
    const params = [status, approved_by || null, id];
    
    corporateDB.run(sql, params, function(err) {
        if (err) {
            console.error('Database error:', err.message);
            res.status(500).json({ error: 'Failed to update expense status' });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Expense not found' });
        } else {
            console.log(`✅ Successfully updated expense ${id} status to ${status}`);
            res.json({ 
                message: 'Expense status updated successfully',
                id: id,
                status: status
            });
        }
    });
});

// GET pending expenses (Corporate only - for approvals page)
app.get('/expense/pending', (req, res) => {
    const sql = 'SELECT * FROM expenses WHERE status = "pending" ORDER BY created_at DESC';
    
    corporateDB.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error fetching pending expenses:', err.message);
            res.status(500).json({ error: 'Failed to fetch pending expenses' });
        } else {
            console.log(`Fetched ${rows.length} pending expenses from corporate database`);
            res.json(rows);
        }
    });
});

// User Signup Endpoint
app.post('/auth/signup', (req, res) => {
    console.log('=== SIGNUP REQUEST ===');
    const { username, password, tracker_type, role } = req.body;
    
    console.log('Signup data:', { username, tracker_type, role });
    
    if (!username || !password || !tracker_type) {
        return res.status(400).json({ error: 'Username, password, and tracker_type are required' });
    }
    
    const db = getDB(tracker_type);
    
    // Check if user already exists
    db.get('SELECT username FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (row) {
            return res.status(409).json({ error: 'Username already exists' });
        }
        
        // Insert new user
        let sql, params;
        if (tracker_type === 'company') {
            // Corporate users need a role
            if (!role || !['employee', 'admin'].includes(role)) {
                return res.status(400).json({ error: 'Valid role required for corporate users (employee or admin)' });
            }
            sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
            params = [username, password, role];
        } else {
            // Personal users don't have roles
            sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
            params = [username, password];
        }
        
        db.run(sql, params, function(err) {
            if (err) {
                console.error('Error creating user:', err.message);
                return res.status(500).json({ error: 'Failed to create user' });
            }
            
            console.log(`✅ User created: ${username} in ${tracker_type} database`);
            res.json({ 
                success: true,
                username: username,
                tracker_type: tracker_type,
                role: role || 'personal'
            });
        });
    });
});

// User Login Endpoint
app.post('/auth/login', (req, res) => {
    console.log('=== LOGIN REQUEST ===');
    const { username, password, tracker_type } = req.body;
    
    console.log('Login attempt:', { username, tracker_type });
    
    if (!username || !password || !tracker_type) {
        return res.status(400).json({ error: 'Username, password, and tracker_type are required' });
    }
    
    const db = getDB(tracker_type);
    
    // Find user
    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!row) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        console.log(`✅ User logged in: ${username} from ${tracker_type} database`);
        res.json({
            success: true,
            username: row.username,
            tracker_type: tracker_type,
            role: row.role || 'personal'
        });
    });
});

// Seed default users endpoint (for testing)
app.post('/auth/seed-defaults', (req, res) => {
    console.log('=== SEEDING DEFAULT USERS ===');
    
    const defaultUsers = [
        { username: 'admin', password: 'admin123', tracker_type: 'company', role: 'admin' },
        { username: 'employee1', password: 'password1', tracker_type: 'company', role: 'employee' },
        { username: 'john', password: 'john123', tracker_type: 'personal', role: null }
    ];
    
    let completed = 0;
    const results = [];
    
    defaultUsers.forEach(user => {
        const db = getDB(user.tracker_type);
        
        // Check if user exists
        db.get('SELECT username FROM users WHERE username = ?', [user.username], (err, row) => {
            if (!row) {
                // Insert user
                let sql, params;
                if (user.tracker_type === 'company') {
                    sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
                    params = [user.username, user.password, user.role];
                } else {
                    sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
                    params = [user.username, user.password];
                }
                
                db.run(sql, params, function(err) {
                    completed++;
                    if (err) {
                        results.push({ username: user.username, status: 'error', error: err.message });
                    } else {
                        results.push({ username: user.username, status: 'created', tracker: user.tracker_type });
                        console.log(`✅ Created default user: ${user.username} (${user.tracker_type})`);
                    }
                    
                    if (completed === defaultUsers.length) {
                        res.json({ success: true, results });
                    }
                });
            } else {
                completed++;
                results.push({ username: user.username, status: 'already exists' });
                
                if (completed === defaultUsers.length) {
                    res.json({ success: true, results });
                }
            }
        });
    });
});

// GET all money received (Personal tracker only)
app.get('/money-received', (req, res) => {
    const username = req.query.username; // Get username from query params
    
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }
    
    const sql = 'SELECT * FROM money_received WHERE user_id = ? ORDER BY created_at DESC';
    const params = [username];
    
    console.log(`Fetching money received for user: ${username}`);
    
    personalDB.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Error fetching money received:', err.message);
            res.status(500).json({ error: 'Failed to fetch money received' });
        } else {
            console.log(`Fetched ${rows.length} money received records for user: ${username}`);
            res.json(rows);
        }
    });
});

// POST new money received (Personal tracker only)
app.post('/money-received', (req, res) => {
    console.log('POST /money-received received');
    
    const { source, amount, date, user_id } = req.body;
    
    console.log('Extracted fields:', { source, amount, date, user_id });
    
    // Validate required fields
    if (!source || !amount || !date || !user_id) {
        console.log('Validation failed - missing fields');
        return res.status(400).json({ 
            error: 'All fields are required',
            received: { source, amount, date, user_id }
        });
    }
    
    const sql = 'INSERT INTO money_received (source, amount, date, user_id) VALUES (?, ?, ?, ?)';
    const params = [
        source, 
        parseFloat(amount), 
        date,
        user_id
    ];
    
    console.log('Inserting money received:', sql);
    console.log('With params:', params);
    
    personalDB.run(sql, params, function(err) {
        if (err) {
            console.error('Database error:', err.message);
            res.status(500).json({ error: 'Failed to add money received', details: err.message });
        } else {
            console.log(`✅ Successfully added money received with ID: ${this.lastID}`);
            res.json({ 
                id: this.lastID, 
                message: 'Money received added successfully',
                moneyReceived: { id: this.lastID, source, amount: parseFloat(amount), date }
            });
        }
    });
});

// DELETE money received (Personal tracker only)
app.delete('/money-received', (req, res) => {
    console.log('=== DELETE MONEY RECEIVED REQUEST RECEIVED ===');
    
    const id = req.query.id;
    const username = req.query.username;
    
    console.log('Money received ID to delete:', id);
    console.log('Username:', username);
    
    if (!id || !username) {
        console.log('ERROR: ID and username are required');
        return res.status(400).json({ error: 'ID and username are required' });
    }
    
    const sql = 'DELETE FROM money_received WHERE id = ? AND user_id = ?';
    
    personalDB.run(sql, [id, username], function(err) {
        if (err) {
            console.error('Database error during deletion:', err.message);
            res.status(500).json({ error: 'Failed to delete money received', details: err.message });
        } else {
            if (this.changes === 0) {
                console.log('No money received record found with ID:', id);
                res.status(404).json({ error: 'Money received record not found', id: id });
            } else {
                console.log(`✅ Successfully deleted money received with ID: ${id}`);
                res.json({ 
                    message: 'Money received deleted successfully',
                    deletedId: id,
                    changes: this.changes
                });
            }
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Expense Tracker API is running',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    personalDB.close((err) => {
        if (err) {
            console.error('Error closing personal database:', err.message);
        } else {
            console.log('Personal database closed.');
        }
    });
    corporateDB.close((err) => {
        if (err) {
            console.error('Error closing corporate database:', err.message);
        } else {
            console.log('Corporate database closed.');
        }
        process.exit(0);
    });
});

// Health check endpoint for Java client
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        message: 'Expensify API is running',
        timestamp: new Date().toISOString(),
        databases: {
            personal: 'connected',
            corporate: 'connected'
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Expensify Server running on http://localhost:${PORT}`);
    console.log(`📊 Personal Database: SQLite (personal_expenses.db)`);
    console.log(`🏢 Corporate Database: SQLite (corporate_expenses.db)`);
    console.log(`🌐 Frontend: http://localhost:${PORT}`);
    console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;