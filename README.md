# CodeAlpha_ECommerceStore — CodeAlpha E-Commerce Platform

### Full Stack Web Development Internship — Task 1: Curated E-Commerce Store

An end-to-end full-stack e-commerce web application built strictly in accordance with the **CodeAlpha Internship** task requirements, featuring a modern curated boutique featuring 10 completely unique, bespoke design artifacts and speculative technology items in an Obsidian Luxe dark aesthetic.

---

## 📌 Project Overview & Unique Features

This project implements a complete, responsive e-commerce web platform containing:

1. **Curated Avant-Garde Product Catalog (100% Unique Design Objects)**:
   - Zero generic or copied tutorial items. Replaces cliché headphones, mugs, and sneakers with 10 rare, bespoke design pieces:
     * *Levitating Ferrofluid Acoustic Sound Sculptor* (Cyber-Acoustics)
     * *IN-14 Dual-Core Cyberpunk Nixie Desk Clock* (Retro-Futurism)
     * *Damascus Forged Modular Split Mechanical Deck* (Studio Tech)
     * *Bioluminescent Dinoflagellate Living Algae Sphere* (Bio-Living)
     * *Obsidian Titanium Bio-Sensory Smart Ring Gen-4* (Wearable Tech)
     * *Cast Architectural Concrete & Brass Ultrasonic Diffuser* (Artisanal Living)
     * *Self-Balancing Gyroscopic Aerograde Titanium Stylus* (Design Artifacts)
     * *Sailcloth X-Pac Solar Modular Crossbody Sling* (Tactical Gear)
     * *Anti-Gravity Magnetic Floating Geode Planter* (Bio-Living)
     * *Dichroic Hypercube Infinite Optical Prism* (Ambient Art)
   - Real-time instant search, category filter chips, and price/alphabetical sorting.

2. **Obsidian Luxe Dark Aesthetic**:
   - Modern glassmorphic dark interface (`#070A11` obsidian slate, glowing electric cyan `#06B6D4`, and neon violet `#8B5CF6`).
   - Clean typography with Google Fonts Inter and JetBrains Mono.

3. **Product Details View**:
   - Dedicated view (`product.html?id=...`) featuring high-resolution imagery, craftsmanship specs sheet, live inventory vault stock countdown, and quantity controls.
   - "Acquire / Add to Bag" and instant checkout actions.

4. **Shopping Cart & Checkout**:
   - Persistent client-side cart allowing users to modify quantities, delete items, view live subtotals, and authorize acquisitions.
   - Dynamic cart counter badge in navigation header with pulse glow.

4. **Order Processing**:
   - Comprehensive checkout system capturing customer details, shipping address, and payment method selection (Credit/Debit Card, Cash on Delivery, UPI).
   - Backend order validation, stock deduction, and persistent database storage.
   - Instant order confirmation invoice (`orders.html?orderId=...`) with itemized breakdown and reference ID.

5. **User Registration & Login**:
   - Secure account registration and authentication.
   - Passwords hashed using `bcryptjs` and authenticated via JSON Web Tokens (JWT).
   - Logged-in user profile header and order history view (`/api/my-orders`).

6. **Database Persistence**:
   - **SQLite** database (`ecommerce.db`) managing relational tables:
     - `users` (id, name, email, password, created_at)
     - `products` (id, name, description, price, image_url, category, stock)
     - `orders` (id, user_id, customer_name, customer_email, shipping_address, payment_method, items, total_amount, status, created_at)
   - Pre-seeded with catalog items for immediate testing upon startup.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3 (Modern Responsive Flexbox/Grid), JavaScript (Vanilla ES6+)
- **Backend**: Node.js, Express.js REST API
- **Database**: SQLite3
- **Authentication**: JWT (JSON Web Tokens) & `bcryptjs`

---

## 📂 Project Directory Structure

```
CodeAlpha_ECommerceStore/
├── database.js          # SQLite connection, schema, and sample catalog seed
├── server.js            # Express server, API routes, and static file server
├── package.json         # Project metadata and dependencies
├── public/              # Client-side frontend
│   ├── index.html       # Product listings & store homepage
│   ├── product.html     # Single product details view
│   ├── cart.html        # Shopping cart & order processing / checkout
│   ├── login.html       # User registration and sign-in
│   ├── orders.html      # Order confirmation receipt & user order history
│   ├── style.css        # Responsive stylesheet
│   └── app.js           # Shared frontend scripts, auth & cart state
└── README.md            # Project documentation & setup instructions
```

---

## 🚀 Getting Started & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.0 or higher recommended)
- `npm`

### Step 1: Install Dependencies
Open a terminal in the project directory and run:
```bash
npm install
```

### Step 2: Start the Server
```bash
npm start
```

### Step 3: Open in Browser
Visit the following URL in your web browser:
```
http://localhost:3000
```

---

## 🧪 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | Get list of all products (with optional `?category=` & `?search=`) |
| `GET` | `/api/products/:id` | Get details for a specific product |
| `POST` | `/api/register` | Register a new user account |
| `POST` | `/api/login` | Log in and receive JWT token |
| `GET` | `/api/me` | Get logged-in user profile (Requires Bearer token) |
| `POST` | `/api/orders` | Process and place a new customer order |
| `GET` | `/api/orders/:id` | Get order details & confirmation receipt by ID |
| `GET` | `/api/my-orders` | Get order history of logged-in user (Requires Bearer token) |

---

## 👨‍💻 Submission Notes for CodeAlpha Internship
- **Repository Name**: `CodeAlpha_ECommerceStore`
- **Domain**: Full Stack Web Development
- **Task**: Task 1 (Simple E-Commerce Store)
