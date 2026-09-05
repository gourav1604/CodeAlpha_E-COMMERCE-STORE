const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'codealpha_super_secret_key_2026';

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// In-Memory Rate Limiter for Authentication
const authRateLimits = new Map();
function rateLimitAuth(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxAttempts = 60;

  const record = authRateLimits.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + windowMs;
  }

  record.count++;
  authRateLimits.set(ip, record);

  if (record.count > maxAttempts) {
    return res.status(429).json({ error: 'Too many authentication attempts. Please try again later.' });
  }
  next();
}

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
app.post('/api/register', rateLimitAuth, (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please provide name, email, and password.' });
  }

  const cleanName = String(name).trim();
  const cleanEmail = String(email).trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: 'Please provide a valid email address format.' });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  // Check if user already exists
  db.get('SELECT * FROM users WHERE email = ?', [cleanEmail], async (err, existingUser) => {
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
      db.run(sql, [cleanName, cleanEmail, hashedPassword], function (insertErr) {
        if (insertErr) {
          return res.status(500).json({ error: 'Failed to create user account.' });
        }

        const newUser = { id: this.lastID, name: cleanName, email: cleanEmail };
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
app.post('/api/login', rateLimitAuth, (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();

  db.get('SELECT * FROM users WHERE email = ?', [cleanEmail], async (err, user) => {
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

// 1. Create / Process New Order (Tamper-Proof Server-Side Price Calculation)
app.post('/api/orders', optionalAuth, (req, res) => {
  const { customer_name, customer_email, shipping_address, payment_method, items } = req.body;

  if (!customer_name || !customer_email || !shipping_address || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Please provide all required checkout details with valid items.' });
  }

  // Validate item format
  const validProductIds = items.map(i => parseInt(i.id)).filter(id => !isNaN(id) && id > 0);
  if (validProductIds.length !== items.length) {
    return res.status(400).json({ error: 'Invalid product item format in cart.' });
  }

  // Query actual product prices from database to calculate guaranteed accurate total
  const placeholders = validProductIds.map(() => '?').join(',');
  db.all(`SELECT id, name, price, stock FROM products WHERE id IN (${placeholders})`, validProductIds, (pErr, dbProducts) => {
    if (pErr || !dbProducts || dbProducts.length === 0) {
      return res.status(500).json({ error: 'Failed to verify product prices against catalog.' });
    }

    const catalogMap = new Map(dbProducts.map(p => [p.id, p]));
    let verifiedTotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const dbProd = catalogMap.get(parseInt(item.id));
      if (!dbProd) {
        return res.status(400).json({ error: `Product ID #${item.id} not found in store catalog.` });
      }

      const qty = Math.max(1, parseInt(item.quantity) || 1);
      verifiedTotal += dbProd.price * qty;

      verifiedItems.push({
        id: dbProd.id,
        name: dbProd.name,
        price: dbProd.price, // Server verified price!
        quantity: qty
      });
    }

    const finalCalculatedTotal = Math.round(verifiedTotal * 100) / 100;
    const userId = req.user ? req.user.id : null;
    const itemsJson = JSON.stringify(verifiedItems);
    const payment = payment_method || 'Credit/Debit Card';

    const sql = `
      INSERT INTO orders (user_id, customer_name, customer_email, shipping_address, payment_method, items, total_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Processing')
    `;

    db.run(
      sql,
      [userId, String(customer_name).trim(), String(customer_email).toLowerCase().trim(), String(shipping_address).trim(), payment, itemsJson, finalCalculatedTotal],
      function (err) {
        if (err) {
          console.error('Order creation error:', err);
          return res.status(500).json({ error: 'Failed to process order.' });
        }

        const orderId = this.lastID;

        // Deduct stock for ordered items
        verifiedItems.forEach((item) => {
          db.run('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?', [item.quantity, item.id]);
        });

        res.status(201).json({
          message: 'Order placed successfully!',
          orderId: orderId,
          orderDetails: {
            id: orderId,
            customer_name: String(customer_name).trim(),
            customer_email: String(customer_email).toLowerCase().trim(),
            shipping_address: String(shipping_address).trim(),
            payment_method: payment,
            total_amount: finalCalculatedTotal,
            status: 'Processing',
            items: verifiedItems
          }
        });
      }
    );
  });
});

// 2. Get Single Order by ID (with privacy masking for non-owners)
app.get('/api/orders/:id', optionalAuth, (req, res) => {
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

    // Check if requester owns this order
    const isOwner = req.user && order.user_id && req.user.id === order.user_id;

    if (!isOwner && order.user_id) {
      // Mask personal information for privacy
      order.customer_email = order.customer_email.replace(/^(.{2})(.*)(@.*)$/, '$1***$3');
      order.shipping_address = 'Address hidden for privacy';
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
