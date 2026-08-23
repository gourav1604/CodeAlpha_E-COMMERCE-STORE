# CodeAlpha_ECommerceStore

### Full Stack Web Development Internship — Task 1: Simple E-Commerce Store

An end-to-end full-stack e-commerce web application built strictly in accordance with the **CodeAlpha Internship** task requirements.

---

## 📌 Project Overview & Features

This project implements a complete, responsive e-commerce web platform containing:

1. **Product Listings**:
   - Dynamic catalog displaying products with images, categories, descriptions, prices, and stock statuses.
   - Real-time search by keywords and instant category filtering (Electronics, Fashion, Accessories, Home & Living).

2. **Product Details Page**:
   - Dedicated page (`product.html?id=...`) showing complete specifications, high-resolution imagery, real-time stock availability, and a quantity selector.
   - "Add to Cart" and "Buy Now" direct actions.

3. **Shopping Cart**:
   - Persistent client-side cart allowing users to view items, modify quantities, remove products, and compute live subtotals and grand totals.
   - Dynamic cart counter badge in navigation header.

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
