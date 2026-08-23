const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'ecommerce.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to SQLite database', err);
  } else {
    console.log('Connected to SQLite database at', dbPath);
  }
});

// Initialize Tables
db.serialize(() => {
  // Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Products Table
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      image_url TEXT NOT NULL,
      category TEXT NOT NULL,
      stock INTEGER DEFAULT 20
    )
  `);

  // Orders Table
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      items TEXT NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'Processing',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Seed Products if table is empty
  db.get("SELECT COUNT(*) AS count FROM products", (err, row) => {
    if (err) {
      console.error("Error checking products count:", err);
      return;
    }

    if (row.count === 0) {
      console.log("Seeding sample products...");
      const sampleProducts = [
        {
          name: "Wireless Noise-Canceling Headphones",
          description: "Premium over-ear headphones with active noise cancellation, 30-hour battery life, and crystal-clear high fidelity sound.",
          price: 2499.00,
          category: "Electronics",
          image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
          stock: 25
        },
        {
          name: "Minimalist Smart Watch",
          description: "Sleek touchscreen smartwatch with heart-rate monitoring, step tracking, GPS navigation, and water resistance up to 50 meters.",
          price: 3999.00,
          category: "Electronics",
          image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
          stock: 18
        },
        {
          name: "Classic Leather Backpack",
          description: "Handcrafted genuine leather backpack with a padded laptop compartment (up to 15.6 inch), spacious interior, and durable brass zippers.",
          price: 1899.00,
          category: "Fashion",
          image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
          stock: 12
        },
        {
          name: "Ergonomic Mechanical Keyboard",
          description: "RGB backlit mechanical keyboard with tactile blue switches, detachable braided USB-C cable, and aircraft-grade aluminum frame.",
          price: 1499.00,
          category: "Electronics",
          image_url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
          stock: 30
        },
        {
          name: "Stainless Steel Insulated Bottle",
          description: "Double-walled vacuum insulated water bottle that keeps drinks ice cold for 24 hours or piping hot for 12 hours. BPA-free.",
          price: 499.00,
          category: "Accessories",
          image_url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80",
          stock: 40
        },
        {
          name: "Polarized Retro Sunglasses",
          description: "Timeless UV400 protective polarized sunglasses with lightweight acetate frame and glare-reduction coating.",
          price: 799.00,
          category: "Fashion",
          image_url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80",
          stock: 22
        },
        {
          name: "Modern Ceramic Coffee Mug Set",
          description: "Set of 4 matte-finish ceramic mugs crafted for everyday coffee, tea, and espresso lovers. Microwave and dishwasher safe.",
          price: 599.00,
          category: "Home",
          image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
          stock: 15
        },
        {
          name: "Ultra-Light Running Shoes",
          description: "Breathable athletic sneakers with responsive cushioning soles designed for maximum comfort and speed during workouts.",
          price: 2199.00,
          category: "Fashion",
          image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
          stock: 16
        }
      ];

      const stmt = db.prepare("INSERT INTO products (name, description, price, image_url, category, stock) VALUES (?, ?, ?, ?, ?, ?)");
      sampleProducts.forEach(p => {
        stmt.run(p.name, p.description, p.price, p.image_url, p.category, p.stock);
      });
      stmt.finalize();
      console.log("Sample products successfully inserted.");
    }
  });
});

module.exports = db;
