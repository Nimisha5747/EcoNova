import { auth, db } from './utils/firebase.js';
import { collection, doc, getDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

let cartItems = [];

// Initialize cart
document.addEventListener('DOMContentLoaded', () => {
    const user = auth.currentUser;
    if (user) {
        loadCart(user.uid);
    } else {
        showLoginPrompt();
    }

    // Add event listener for checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }
});

// Load cart items from Firestore
async function loadCart(userId) {
    const cartRef = doc(db, 'carts', userId);
    const cartDoc = await getDoc(cartRef);

    if (cartDoc.exists()) {
        cartItems = cartDoc.data().items || [];
        renderCart();
    }
}

// Render cart items
function renderCart() {
    const cartItemsContainer = document.getElementById('cartItems');
    if (!cartItemsContainer) return;

    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
                <a href="../pages/shop.html" class="continue-shopping">Continue Shopping</a>
            </div>
        `;
        updateSummary(0);
        return;
    }

    cartItemsContainer.innerHTML = cartItems.map((item, index) => `
        <div class="cart-item" data-index="${index}">
            <img src="${item.image}" alt="${item.name}">
            <div class="item-details">
                <h3>${item.name}</h3>
                <p class="item-price">$${item.price.toFixed(2)}</p>
            </div>
            <div class="item-quantity">
                <button class="quantity-btn minus" onclick="updateQuantity(${index}, -1)">-</button>
                <span>${item.quantity}</span>
                <button class="quantity-btn plus" onclick="updateQuantity(${index}, 1)">+</button>
            </div>
            <button class="remove-item" onclick="removeItem(${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');

    updateSummary();
}

// Update item quantity
async function updateQuantity(index, change) {
    const user = auth.currentUser;
    if (!user) return;

    const newQuantity = cartItems[index].quantity + change;
    if (newQuantity < 1) {
        removeItem(index);
    } else {
        cartItems[index].quantity = newQuantity;
        await updateCart(user.uid);
        renderCart();
    }
}

// Remove item from cart
async function removeItem(index) {
    const user = auth.currentUser;
    if (!user) return;

    cartItems.splice(index, 1);
    await updateCart(user.uid);
    renderCart();
}

// Update cart in Firestore
async function updateCart(userId) {
    const cartRef = doc(db, 'carts', userId);
    await updateDoc(cartRef, {
        items: cartItems
    });
}

// Update order summary
function updateSummary() {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 0 ? 5.99 : 0;
    const total = subtotal + shipping;

    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('shipping').textContent = `$${shipping.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

// Handle checkout
async function handleCheckout() {
    const user = auth.currentUser;
    if (!user) {
        showLoginPrompt();
        return;
    }

    if (cartItems.length === 0) {
        alert('Your cart is empty');
        return;
    }

    // Redirect to checkout page
    window.location.href = 'checkout.html';
}

// Show login prompt
function showLoginPrompt() {
    const cartItemsContainer = document.getElementById('cartItems');
    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = `
            <div class="login-prompt">
                <i class="fas fa-user-lock"></i>
                <p>Please log in to view your cart</p>
                <a href="login.html" class="login-btn">Login</a>
            </div>
        `;
    }
    updateSummary(0);
}

// Export functions for use in other files
window.updateQuantity = updateQuantity;
window.removeItem = removeItem; 