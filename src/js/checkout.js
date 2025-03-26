import { auth, db } from '../utils/firebase.js';
import { 
    doc, 
    getDoc, 
    collection, 
    query, 
    where, 
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js';

// DOM Elements
const savedAddressesContainer = document.getElementById('savedAddresses');
const addAddressBtn = document.getElementById('addAddressBtn');
const addressModal = document.getElementById('addressModal');
const addressForm = document.getElementById('addressForm');
const closeModalBtn = document.querySelector('.close-modal');
const orderItemsContainer = document.getElementById('orderItems');
const placeOrderBtn = document.getElementById('placeOrderBtn');
const creditCardForm = document.getElementById('creditCardForm');
const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');

// State
let cartItems = [];
let selectedAddress = null;
let addresses = [];

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    if (!auth.currentUser) {
        window.location.href = 'login.html';
        return;
    }
    loadCart();
    loadAddresses();
});

addAddressBtn.addEventListener('click', () => showModal(addressModal));
closeModalBtn.addEventListener('click', () => hideModal(addressModal));
addressForm.addEventListener('submit', handleAddressSubmit);
placeOrderBtn.addEventListener('click', handlePlaceOrder);
paymentMethods.forEach(method => {
    method.addEventListener('change', handlePaymentMethodChange);
});

// Load cart items
async function loadCart() {
    try {
        const userCartRef = doc(db, 'carts', auth.currentUser.uid);
        const cartDoc = await getDoc(userCartRef);
        
        if (cartDoc.exists()) {
            cartItems = cartDoc.data().items || [];
            renderOrderItems();
            updateSummary();
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        showMessage('Error loading cart items', 'error');
    }
}

// Load saved addresses
async function loadAddresses() {
    try {
        const addressesRef = collection(db, 'users', auth.currentUser.uid, 'addresses');
        const addressesSnapshot = await getDocs(addressesRef);
        
        addresses = addressesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        renderAddresses();
    } catch (error) {
        console.error('Error loading addresses:', error);
        showMessage('Error loading addresses', 'error');
    }
}

// Render order items
function renderOrderItems() {
    if (cartItems.length === 0) {
        orderItemsContainer.innerHTML = '<p>Your cart is empty</p>';
        return;
    }

    orderItemsContainer.innerHTML = cartItems.map(item => `
        <div class="order-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="item-details">
                <h4>${item.name}</h4>
                <p>Quantity: ${item.quantity}</p>
                <p>$${(item.price * item.quantity).toFixed(2)}</p>
            </div>
        </div>
    `).join('');
}

// Update order summary
function updateSummary() {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 0 ? 5.99 : 0;
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + shipping + tax;

    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('shipping').textContent = `$${shipping.toFixed(2)}`;
    document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

// Render saved addresses
function renderAddresses() {
    if (addresses.length === 0) {
        savedAddressesContainer.innerHTML = '<p>No saved addresses</p>';
        return;
    }

    savedAddressesContainer.innerHTML = addresses.map(address => `
        <div class="address-card ${address.id === selectedAddress?.id ? 'selected' : ''}" 
             data-id="${address.id}">
            <h4>${address.addressName}</h4>
            <p>${address.streetAddress}</p>
            <p>${address.city}, ${address.state} ${address.zipCode}</p>
            <p>${address.country}</p>
            <div class="address-actions">
                <button class="select-address-btn" data-id="${address.id}">
                    ${address.id === selectedAddress?.id ? 'Selected' : 'Select'}
                </button>
                <button class="delete-address-btn" data-id="${address.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    // Add event listeners to address cards
    document.querySelectorAll('.select-address-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const addressId = e.target.dataset.id;
            selectAddress(addressId);
        });
    });

    document.querySelectorAll('.delete-address-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const addressId = e.target.dataset.id;
            deleteAddress(addressId);
        });
    });
}

// Handle address selection
function selectAddress(addressId) {
    selectedAddress = addresses.find(addr => addr.id === addressId);
    renderAddresses();
}

// Handle address deletion
async function deleteAddress(addressId) {
    try {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'addresses', addressId));
        addresses = addresses.filter(addr => addr.id !== addressId);
        if (selectedAddress?.id === addressId) {
            selectedAddress = null;
        }
        renderAddresses();
        showMessage('Address deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting address:', error);
        showMessage('Error deleting address', 'error');
    }
}

// Handle new address submission
async function handleAddressSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(addressForm);
    const addressData = {
        addressName: formData.get('addressName'),
        streetAddress: formData.get('streetAddress'),
        city: formData.get('city'),
        state: formData.get('state'),
        zipCode: formData.get('zipCode'),
        country: formData.get('country')
    };

    try {
        const docRef = await addDoc(collection(db, 'users', auth.currentUser.uid, 'addresses'), addressData);
        addresses.push({ id: docRef.id, ...addressData });
        selectAddress(docRef.id);
        hideModal(addressModal);
        addressForm.reset();
        showMessage('Address added successfully', 'success');
    } catch (error) {
        console.error('Error adding address:', error);
        showMessage('Error adding address', 'error');
    }
}

// Handle payment method change
function handlePaymentMethodChange(e) {
    const method = e.target.value;
    creditCardForm.style.display = method === 'creditCard' ? 'block' : 'none';
}

// Handle order placement
async function handlePlaceOrder() {
    if (!selectedAddress) {
        showMessage('Please select a shipping address', 'error');
        return;
    }

    if (cartItems.length === 0) {
        showMessage('Your cart is empty', 'error');
        return;
    }

    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    if (paymentMethod === 'creditCard') {
        if (!creditCardForm.checkValidity()) {
            showMessage('Please fill in all credit card details', 'error');
            return;
        }
    }

    try {
        // Create order in Firestore
        const orderData = {
            userId: auth.currentUser.uid,
            items: cartItems,
            shippingAddress: selectedAddress,
            paymentMethod,
            status: 'pending',
            createdAt: serverTimestamp(),
            total: parseFloat(document.getElementById('total').textContent.replace('$', '')),
            subtotal: parseFloat(document.getElementById('subtotal').textContent.replace('$', '')),
            shipping: parseFloat(document.getElementById('shipping').textContent.replace('$', '')),
            tax: parseFloat(document.getElementById('tax').textContent.replace('$', ''))
        };

        const orderRef = await addDoc(collection(db, 'orders'), orderData);

        // Clear cart
        await updateDoc(doc(db, 'carts', auth.currentUser.uid), {
            items: []
        });

        // Redirect to order confirmation
        window.location.href = `order-confirmation.html?orderId=${orderRef.id}`;
    } catch (error) {
        console.error('Error placing order:', error);
        showMessage('Error placing order', 'error');
    }
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