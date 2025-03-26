import { auth, db } from '../utils/firebase.js';
import { 
    collection, 
    getDocs, 
    query, 
    where, 
    orderBy,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    increment
} from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js';

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const productModal = document.getElementById('productModal');
const closeModalBtn = document.querySelector('.close-modal');
const applyFiltersBtn = document.getElementById('applyFilters');
const sortSelect = document.getElementById('sortSelect');
const priceRange = document.getElementById('priceRange');
const minPrice = document.getElementById('minPrice');
const maxPrice = document.getElementById('maxPrice');

// State
let products = [];
let filteredProducts = [];
let currentFilters = {
    categories: [],
    minPrice: 0,
    maxPrice: 1000,
    sortBy: 'featured',
    searchQuery: ''
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Search functionality
    searchBtn.addEventListener('click', () => {
        currentFilters.searchQuery = searchInput.value.toLowerCase();
        filterProducts();
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentFilters.searchQuery = searchInput.value.toLowerCase();
            filterProducts();
        }
    });

    // Category filters
    document.querySelectorAll('input[name="category"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const categories = Array.from(document.querySelectorAll('input[name="category"]:checked'))
                .map(cb => cb.value);
            currentFilters.categories = categories;
            filterProducts();
        });
    });

    // Price range
    priceRange.addEventListener('input', (e) => {
        currentFilters.maxPrice = parseInt(e.target.value);
        maxPrice.value = currentFilters.maxPrice;
        filterProducts();
    });

    minPrice.addEventListener('change', () => {
        currentFilters.minPrice = parseInt(minPrice.value) || 0;
        filterProducts();
    });

    maxPrice.addEventListener('change', () => {
        currentFilters.maxPrice = parseInt(maxPrice.value) || 1000;
        filterProducts();
    });

    // Sort functionality
    sortSelect.addEventListener('change', () => {
        currentFilters.sortBy = sortSelect.value;
        filterProducts();
    });

    // Modal
    closeModalBtn.addEventListener('click', () => hideModal(productModal));
    window.addEventListener('click', (e) => {
        if (e.target === productModal) {
            hideModal(productModal);
        }
    });
}

// Load products from Firestore
async function loadProducts() {
    try {
        const productsRef = collection(db, 'products');
        const productsSnapshot = await getDocs(productsRef);
        
        products = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        filterProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        showMessage('Error loading products', 'error');
    }
}

// Filter and sort products
function filterProducts() {
    filteredProducts = products.filter(product => {
        // Category filter
        if (currentFilters.categories.length > 0 && 
            !currentFilters.categories.includes(product.category)) {
            return false;
        }

        // Price filter
        if (product.price < currentFilters.minPrice || 
            product.price > currentFilters.maxPrice) {
            return false;
        }

        // Search filter
        if (currentFilters.searchQuery && 
            !product.name.toLowerCase().includes(currentFilters.searchQuery) &&
            !product.description.toLowerCase().includes(currentFilters.searchQuery)) {
            return false;
        }

        return true;
    });

    // Sort products
    switch (currentFilters.sortBy) {
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
            filteredProducts.sort((a, b) => b.createdAt - a.createdAt);
            break;
        default: // featured
            filteredProducts.sort((a, b) => b.rating - a.rating);
    }

    renderProducts();
}

// Render products to the grid
function renderProducts() {
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>No products found matching your criteria</p>
            </div>
        `;
        return;
    }

    productsGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card" data-id="${product.id}">
            <img src="${product.image}" alt="${product.name}">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <div class="product-rating">
                    ${generateStarRating(product.rating)}
                    <span>(${product.reviewCount})</span>
                </div>
                <button class="view-details-btn" data-id="${product.id}">
                    View Details
                </button>
            </div>
        </div>
    `).join('');

    // Add event listeners to view details buttons
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.dataset.id;
            showProductDetails(productId);
        });
    });
}

// Show product details in modal
async function showProductDetails(productId) {
    try {
        const productDoc = await getDoc(doc(db, 'products', productId));
        const product = { id: productDoc.id, ...productDoc.data() };

        const modalContent = document.querySelector('.product-modal-content');
        modalContent.innerHTML = `
            <div class="product-details">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <h2>${product.name}</h2>
                    <p class="product-price">$${product.price.toFixed(2)}</p>
                    <div class="product-rating">
                        ${generateStarRating(product.rating)}
                        <span>(${product.reviewCount} reviews)</span>
                    </div>
                    <p class="product-description">${product.description}</p>
                    <div class="product-actions">
                        <div class="quantity-selector">
                            <button class="quantity-btn minus">-</button>
                            <input type="number" value="1" min="1" max="${product.stock}">
                            <button class="quantity-btn plus">+</button>
                        </div>
                        <button class="add-to-cart-btn" data-id="${product.id}">
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners for quantity buttons
        const quantityInput = modalContent.querySelector('input[type="number"]');
        const minusBtn = modalContent.querySelector('.minus');
        const plusBtn = modalContent.querySelector('.plus');

        minusBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value);
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
            }
        });

        plusBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value);
            if (currentValue < product.stock) {
                quantityInput.value = currentValue + 1;
            }
        });

        // Add to cart functionality
        const addToCartBtn = modalContent.querySelector('.add-to-cart-btn');
        addToCartBtn.addEventListener('click', async () => {
            const quantity = parseInt(quantityInput.value);
            await addToCart(product, quantity);
        });

        showModal(productModal);
    } catch (error) {
        console.error('Error loading product details:', error);
        showMessage('Error loading product details', 'error');
    }
}

// Add product to cart
async function addToCart(product, quantity) {
    if (!auth.currentUser) {
        showMessage('Please login to add items to cart', 'error');
        return;
    }

    try {
        const cartRef = collection(db, 'users', auth.currentUser.uid, 'cart');
        const cartItem = {
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: quantity
        };

        await addDoc(cartRef, cartItem);
        hideModal(productModal);
        showMessage('Product added to cart', 'success');
    } catch (error) {
        console.error('Error adding to cart:', error);
        showMessage('Error adding to cart', 'error');
    }
}

// Generate star rating HTML
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let starsHTML = '';

    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            starsHTML += '<i class="fas fa-star"></i>';
        } else if (i === fullStars && hasHalfStar) {
            starsHTML += '<i class="fas fa-star-half-alt"></i>';
        } else {
            starsHTML += '<i class="far fa-star"></i>';
        }
    }

    return starsHTML;
}

// Utility functions
function showModal(modal) {
    modal.style.display = 'block';
}

function hideModal(modal) {
    modal.style.display = 'none';
}

function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
} 