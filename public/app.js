/* ==========================================================================
   CodeAlpha E-Commerce Store - Client Side JavaScript
   ========================================================================== */

const API_BASE = '/api';

// State Management
const Auth = {
  getToken() {
    return localStorage.getItem('token');
  },
  getUser() {
    const userStr = localStorage.getItem('user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  },
  setUser(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showToast('Logged out successfully');
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 500);
  },
  isLoggedIn() {
    return !!this.getToken();
  }
};

const Cart = {
  getItems() {
    try {
      const items = localStorage.getItem('cart');
      return items ? JSON.parse(items) : [];
    } catch (e) {
      return [];
    }
  },
  saveItems(items) {
    localStorage.setItem('cart', JSON.stringify(items));
    updateCartBadge();
  },
  addItem(product, quantity = 1) {
    const items = this.getItems();
    const existingIndex = items.findIndex(i => i.id === product.id);

    if (existingIndex > -1) {
      items[existingIndex].quantity += Number(quantity);
    } else {
      items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: Number(quantity)
      });
    }

    this.saveItems(items);
    showToast(`Added "${product.name}" to cart!`);
  },
  updateQuantity(productId, quantity) {
    let items = this.getItems();
    const item = items.find(i => i.id === productId);
    if (item) {
      item.quantity = Math.max(1, Number(quantity));
      this.saveItems(items);
    }
  },
  removeItem(productId) {
    let items = this.getItems();
    items = items.filter(i => i.id !== productId);
    this.saveItems(items);
    showToast('Item removed from cart');
  },
  clear() {
    localStorage.removeItem('cart');
    updateCartBadge();
  },
  getTotal() {
    const items = this.getItems();
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },
  getCount() {
    const items = this.getItems();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }
};

// UI Utilities
function formatCurrency(amount) {
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

function updateCartBadge() {
  const badge = document.getElementById('cart-count');
  if (badge) {
    const count = Cart.getCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function updateNavbarAuth() {
  const authNav = document.getElementById('nav-auth');
  if (!authNav) return;

  const user = Auth.getUser();
  if (user) {
    authNav.innerHTML = `
      <span class="user-badge">Hi, ${escapeHtml(user.name)}</span>
      <a href="/orders.html" class="nav-link">My Orders</a>
      <a href="javascript:void(0)" onclick="Auth.logout()" class="nav-link" style="color: var(--danger-color);">Logout</a>
    `;
  } else {
    authNav.innerHTML = `
      <a href="/login.html" class="nav-link">Sign In / Register</a>
    `;
  }
}

// Global API Fetch wrapper
async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = Auth.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  updateNavbarAuth();
});
