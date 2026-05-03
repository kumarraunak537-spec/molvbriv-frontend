const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite Database
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Create Tables
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price REAL,
        category TEXT,
        material TEXT,
        stock INTEGER,
        status TEXT,
        image TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT,
        customer_name TEXT,
        product_name TEXT,
        amount REAL,
        status TEXT
      )`);

      // Seed initial data if empty
      db.get("SELECT count(*) as count FROM products", (err, row) => {
        if (row && row.count === 0) {
          console.log('Seeding initial products...');
          const insertStmt = db.prepare("INSERT INTO products (name, price, category, material, stock, status) VALUES (?, ?, ?, ?, ?, ?)");
          insertStmt.run('Polki Jhumka Set', 1299, 'Jhumka', 'Gold Plated', 24, 'Live');
          insertStmt.run('Kundan Necklace', 2899, 'Necklace', 'Kundan', 10, 'Live');
          insertStmt.run('Floral Ear Studs', 649, 'Earrings', 'Silver', 2, 'Low Stock');
          insertStmt.run('Chandbali Jhumka', 1599, 'Jhumka', 'Antique', 30, 'Draft');
          insertStmt.finalize();
        }
      });

      db.get("SELECT count(*) as count FROM orders", (err, row) => {
        if (row && row.count === 0) {
          console.log('Seeding initial orders...');
          const insertStmt = db.prepare("INSERT INTO orders (order_number, customer_name, product_name, amount, status) VALUES (?, ?, ?, ?, ?)");
          insertStmt.run('#MLV-1041', 'Priya Sharma', 'Kundan Necklace', 2899, 'Delivered');
          insertStmt.run('#MLV-1040', 'Ananya R.', 'Polki Jhumka', 1299, 'Shipped');
          insertStmt.run('#MLV-1039', 'Meera V.', 'Rani Haar Set', 4999, 'Processing');
          insertStmt.finalize();
        }
      });
    });
  }
});

// --- API ROUTES ---

// GET all products
app.get('/api/products', (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST new product
app.post('/api/products', (req, res) => {
  const { name, price, category, material, stock, status } = req.body;
  const sql = "INSERT INTO products (name, price, category, material, stock, status) VALUES (?, ?, ?, ?, ?, ?)";
  db.run(sql, [name, price, category, material, stock, status], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name, price, category, material, stock, status });
  });
});

// PUT update product
app.put('/api/products/:id', (req, res) => {
  const { name, price, category, material, stock, status } = req.body;
  const sql = "UPDATE products SET name = ?, price = ?, category = ?, material = ?, stock = ?, status = ? WHERE id = ?";
  db.run(sql, [name, price, category, material, stock, status, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

// DELETE product
app.delete('/api/products/:id', (req, res) => {
  db.run("DELETE FROM products WHERE id = ?", req.params.id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// GET all orders
app.get('/api/orders', (req, res) => {
  db.all("SELECT * FROM orders", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Update order status
app.put('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  db.run("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend Server running on http://localhost:${PORT}`);
});
