const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'codealpha_super_secret_key_2026';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
}

// Optional Auth (for guest or user checkout)
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    req.user = null;
    return next();
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err) {
      req.user = user;
    }
    next();
  });
}

/* =========================================================
   USER AUTHENTICATION ROUTES
   ========================================================= */

// 1. User Registration
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please provide name, email, and password.' });
  }

  // Check if user already exists
  db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()], async (err, existingUser) => {
    if (err) {
      return res.status(500).json({ error: 'Database query error.' });
    }
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
      db.run(sql, [name.trim(), email.toLowerCase().trim(), hashedPassword], function (insertErr) {
        if (insertErr) {
          return res.status(500).json({ error: 'Failed to create user account.' });
        }

        const newUser = { id: this.lastID, name: name.trim(), email: email.toLowerCase().trim() };
        const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: '7d' });

        return res.status(201).json({
          message: 'Account created successfully!',
          token,
          user: newUser
        });
      });
    } catch (hashErr) {
      return res.status(500).json({ error: 'Password encryption error.' });
    }
  });
});

// 2. User Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password.' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error.' });
    }
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const userData = { id: user.id, name: user.name, email: user.email };
    const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful!',
      token,
      user: userData
    });
  });
});

// 3. Get Current Logged-in User Profile
app.get('/api/me', authenticateToken, (req, res) => {
  db.get('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    res.json({ user });
  });
});

/* =========================================================
   PRODUCT ROUTES
   ========================================================= */

// 1. Get All Products (with optional category & search filtering)
app.get('/api/products', (req, res) => {
  const { category, search } = req.query;
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category && category !== 'All') {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY id ASC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch products.' });
    }
    res.json({ products: rows });
  });
});

// 2. Get Single Product Details by ID
app.get('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  db.get('SELECT * FROM products WHERE id = ?', [productId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch product details.' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json({ product: row });
  });
});

/* =========================================================
   ORDER PROCESSING ROUTES
   ========================================================= */

// 1. Create / Process New Order
app.post('/api/orders', optionalAuth, (req, res) => {
  const { customer_name, customer_email, shipping_address, payment_method, items, total_amount } = req.body;

  if (!customer_name || !customer_email || !shipping_address || !items || !items.length || !total_amount) {
    return res.status(400).json({ error: 'Please provide all required checkout details.' });
  }

  const userId = req.user ? req.user.id : null;
  const itemsJson = JSON.stringify(items);
  const payment = payment_method || 'Credit/Debit Card';

  const sql = `
    INSERT INTO orders (user_id, customer_name, customer_email, shipping_address, payment_method, items, total_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Processing')
  `;

  db.run(sql, [userId, customer_name, customer_email, shipping_address, payment, itemsJson, total_amount], function (err) {
    if (err) {
      console.error('Order creation error:', err);
      return res.status(500).json({ error: 'Failed to process order.' });
    }

    const orderId = this.lastID;

    // Deduct stock for ordered items
    items.forEach((item) => {
      if (item.id && item.quantity) {
        db.run('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?', [item.quantity, item.id]);
      }
    });

    res.status(201).json({
      message: 'Order placed successfully!',
      orderId: orderId,
      orderDetails: {
        id: orderId,
        customer_name,
        customer_email,
        shipping_address,
        payment_method: payment,
        total_amount,
        status: 'Processing',
        items
      }
    });
  });
});

// 2. Get Single Order by ID (for confirmation page)
app.get('/api/orders/:id', (req, res) => {
  const orderId = req.params.id;
  db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, order) => {
    if (err || !order) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    try {
      order.items = JSON.parse(order.items);
    } catch (e) {
      order.items = [];
    }
    res.json({ order });
  });
});

// 3. Get Orders of Logged-in User
app.get('/api/my-orders', authenticateToken, (req, res) => {
  const sql = 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC';
  db.all(sql, [req.user.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to retrieve orders.' });
    }
    const formattedOrders = rows.map((order) => {
      try {
        order.items = JSON.parse(order.items);
      } catch (e) {
        order.items = [];
      }
      return order;
    });
    res.json({ orders: formattedOrders });
  });
});

// Fallback to index.html for undefined frontend routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 CodeAlpha E-Commerce Store Server is running!`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
