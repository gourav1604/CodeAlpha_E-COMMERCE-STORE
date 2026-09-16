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

  // Seed Products if table is empty or update to unique curated catalog
  const uniqueProducts = [
    {
      name: "Levitating Ferrofluid Acoustic Sound Sculptor",
      description: "High-fidelity Bluetooth speaker featuring suspended black magnetic ferrofluid that dynamically dances and pulses to real-time sonic waveforms. Crafted with anodized space-grey aluminum and touch acoustics.",
      price: 7499.00,
      category: "Cyber-Acoustics",
      image_url: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80",
      stock: 14
    },
    {
      name: "IN-14 Dual-Core Cyberpunk Nixie Desk Clock",
      description: "Authentic cold-cathode neon vacuum tubes preserved from vintage stock, mounted inside CNC-machined titanium chassis with solid walnut accents, ambient RGB cathode backlighting, and precision quartz timing.",
      price: 12999.00,
      category: "Retro-Futurism",
      image_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80",
      stock: 8
    },
    {
      name: "Damascus Forged Modular Split Mechanical Deck",
      description: "Ergonomic ortholinear split mechanical keyboard with genuine folded Damascus steel top-plate, hot-swappable tactile linear switches, dual rotary precision encoders, and braided magnetic interconnect.",
      price: 9850.00,
      category: "Studio Tech",
      image_url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
      stock: 12
    },
    {
      name: "Bioluminescent Dinoflagellate Living Algae Sphere",
      description: "Hand-blown borosilicate glass sphere containing living Pyrocystis dinoflagellates. Absorbs daylight to produce an enchanting natural neon cyan glow when gently swirled in darkness. Requires zero maintenance.",
      price: 3899.00,
      category: "Bio-Living",
      image_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
      stock: 20
    },
    {
      name: "Obsidian Titanium Bio-Sensory Smart Ring Gen-4",
      description: "Ultra-slim 2.4mm aerograde titanium ring embedded with photoplethysmography (PPG), galvanic skin response, skin temperature sensors, and silent haptic alarms. 7-day battery life on wireless dock.",
      price: 8499.00,
      category: "Wearable Tech",
      image_url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80",
      stock: 16
    },
    {
      name: "Cast Architectural Concrete & Brass Ultrasonic Diffuser",
      description: "Sculptural brutalist aroma diffuser hand-cast in high-density aggregate stone with solid brushed brass dials. Whisper-quiet ultrasonic nebulizer atomizes essential botanicals with ambient warm glow.",
      price: 4299.00,
      category: "Artisanal Living",
      image_url: "https://images.unsplash.com/photo-1602928321679-560bb453f190?w=800&auto=format&fit=crop&q=80",
      stock: 15
    },
    {
      name: "Self-Balancing Gyroscopic Aerograde Titanium Stylus",
      description: "Zero-friction perpetual balance writing instrument engineered from Grade-5 titanium and tungsten carbide. Counterweighted base allows the stylus to spin and balance effortlessly on any flat desk surface.",
      price: 2199.00,
      category: "Design Artifacts",
      image_url: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&auto=format&fit=crop&q=80",
      stock: 25
    },
    {
      name: "Sailcloth X-Pac Solar Modular Crossbody Sling",
      description: "Weatherproof tactical sling constructed from multi-ply composite sailcloth and Cordura 500D. Features integrated thin-film flexible solar harvester panel, FIDLOCK magnetic buckles, and modular dividers.",
      price: 5499.00,
      category: "Tactical Gear",
      image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
      stock: 10
    },
    {
      name: "Anti-Gravity Magnetic Floating Geode Planter",
      description: "Mag-lev botanical display featuring a faceted polygon geode pot floating effortlessly 20mm above an oak base, smoothly rotating 360-degrees for optimal 3D light exposure for miniature succulents.",
      price: 3299.00,
      category: "Bio-Living",
      image_url: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&auto=format&fit=crop&q=80",
      stock: 18
    },
    {
      name: "Dichroic Hypercube Infinite Optical Prism",
      description: "Bespoke optical glass sculpture utilizing multi-layer dielectric optical coatings. Creates an infinite geometric internal refraction landscape that shifts vibrant colors with ambient room angles and lighting.",
      price: 4899.00,
      category: "Ambient Art",
      image_url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop&q=80",
      stock: 11
    }
  ];

  db.get("SELECT COUNT(*) AS count, name FROM products LIMIT 1", (err, row) => {
    if (err) {
      console.error("Error checking products count:", err);
      return;
    }

    // Check if empty or still has generic headphones
    const needsReseed = !row || row.count === 0 || (row.name && row.name.includes("Wireless Noise-Canceling Headphones"));

    if (needsReseed) {
      console.log("Seeding unique avant-garde catalog products...");
      db.run("DELETE FROM products", () => {
        const stmt = db.prepare("INSERT INTO products (name, description, price, image_url, category, stock) VALUES (?, ?, ?, ?, ?, ?)");
        uniqueProducts.forEach(p => {
          stmt.run(p.name, p.description, p.price, p.image_url, p.category, p.stock);
        });
        stmt.finalize();
        console.log("Unique curated catalog successfully populated!");
      });
    }
  });
});

module.exports = db;
