import { auth, db } from './utils/firebase.js';
import { 
    doc, 
    getDoc, 
    updateDoc, 
    collection, 
    query, 
    where, 
    getDocs,
    addDoc,
    deleteDoc
} from 'firebase/firestore';
import { 
    updatePassword, 
    EmailAuthProvider, 
    reauthenticateWithCredential 
} from 'firebase/auth';

// DOM Elements
const profileNavBtns = document.querySelectorAll('.profile-nav-btn');
const profileSections = document.querySelectorAll('.profile-section');
const profileForm = document.getElementById('profileForm');
const passwordForm = document.getElementById('passwordForm');
const addressForm = document.getElementById('addressForm');
const addressModal = document.getElementById('addressModal');
const addAddressBtn = document.getElementById('addAddressBtn');
const closeModalBtn = document.querySelector('.close-modal');
const logoutBtn = document.getElementById('logoutBtn');

// Initialize profile
document.addEventListener('DOMContentLoaded', () => {
    const user = auth.currentUser;
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    loadUserProfile(user);
    loadOrderHistory(user);
    loadSavedAddresses(user);
    setupEventListeners();
});

// Load user profile data
async function loadUserProfile(user) {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
        const userData = userDoc.data();
        document.getElementById('userName').textContent = userData.fullName || 'User';
        document.getElementById('userEmail').textContent = user.email;
        
        // Populate profile form
        document.getElementById('fullName').value = userData.fullName || '';
        document.getElementById('phone').value = userData.phone || '';
        document.getElementById('userType').value = userData.userType || 'individual';
    }
}

// Load order history
async function loadOrderHistory(user) {
    const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid)
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    const ordersList = document.getElementById('ordersList');
    
    if (ordersSnapshot.empty) {
        ordersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-bag"></i>
                <p>No orders found</p>
            </div>
        `;
        return;
    }

    ordersList.innerHTML = ordersSnapshot.docs.map(doc => {
        const order = doc.data();
        return `
            <div class="order-card">
                <div class="order-header">
                    <h4>Order #${doc.id.slice(-6)}</h4>
                    <span class="order-date">${order.date.toDate().toLocaleDateString()}</span>
                </div>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <img src="${item.image}" alt="${item.name}">
                            <div class="item-details">
                                <h5>${item.name}</h5>
                                <p>Quantity: ${item.quantity}</p>
                                <p>$${item.price.toFixed(2)}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="order-footer">
                    <span class="order-total">Total: $${order.total.toFixed(2)}</span>
                    <span class="order-status ${order.status.toLowerCase()}">${order.status}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Load saved addresses
async function loadSavedAddresses(user) {
    const addressesQuery = query(
        collection(db, 'addresses'),
        where('userId', '==', user.uid)
    );
    
    const addressesSnapshot = await getDocs(addressesQuery);
    const addressesList = document.getElementById('addressesList');
    
    if (addressesSnapshot.empty) {
        addressesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-map-marker-alt"></i>
                <p>No saved addresses</p>
            </div>
        `;
        return;
    }

    addressesList.innerHTML = addressesSnapshot.docs.map(doc => {
        const address = doc.data();
        return `
            <div class="address-card">
                <div class="address-header">
                    <h4>${address.name}</h4>
                    <div class="address-actions">
                        <button class="edit-address" data-id="${doc.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-address" data-id="${doc.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p>${address.streetAddress}</p>
                <p>${address.city}, ${address.state} ${address.zipCode}</p>
                <p>${address.country}</p>
            </div>
        `;
    }).join('');
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    profileNavBtns.forEach(btn => {
        if (btn.dataset.section) {
            btn.addEventListener('click', () => switchSection(btn.dataset.section));
        }
    });

    // Profile form
    profileForm.addEventListener('submit', handleProfileUpdate);

    // Password form
    passwordForm.addEventListener('submit', handlePasswordChange);

    // Address form
    addressForm.addEventListener('submit', handleAddressSubmit);

    // Address modal
    addAddressBtn.addEventListener('click', () => showModal(addressModal));
    closeModalBtn.addEventListener('click', () => hideModal(addressModal));

    // Logout
    logoutBtn.addEventListener('click', handleLogout);

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === addressModal) {
            hideModal(addressModal);
        }
    });
}

// Switch between profile sections
function switchSection(sectionId) {
    // Update active nav button
    profileNavBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === sectionId);
    });

    // Update active section
    profileSections.forEach(section => {
        section.classList.toggle('active', section.id === sectionId);
    });
}

// Handle profile update
async function handleProfileUpdate(e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const formData = new FormData(profileForm);
    const userData = {
        fullName: formData.get('fullName'),
        phone: formData.get('phone'),
        userType: formData.get('userType')
    };

    try {
        await updateDoc(doc(db, 'users', user.uid), userData);
        showMessage('Profile updated successfully', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Handle password change
async function handlePasswordChange(e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const formData = new FormData(passwordForm);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    if (newPassword !== confirmPassword) {
        showMessage('New passwords do not match', 'error');
        return;
    }

    try {
        const credential = EmailAuthProvider.credential(
            user.email,
            currentPassword
        );
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        showMessage('Password updated successfully', 'success');
        passwordForm.reset();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Handle address submission
async function handleAddressSubmit(e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const formData = new FormData(addressForm);
    const addressData = {
        userId: user.uid,
        name: formData.get('addressName'),
        streetAddress: formData.get('streetAddress'),
        city: formData.get('city'),
        state: formData.get('state'),
        zipCode: formData.get('zipCode'),
        country: formData.get('country')
    };

    try {
        await addDoc(collection(db, 'addresses'), addressData);
        hideModal(addressModal);
        addressForm.reset();
        loadSavedAddresses(user);
        showMessage('Address added successfully', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Handle logout
async function handleLogout() {
    try {
        await auth.signOut();
        window.location.href = 'login.html';
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Utility functions
function showModal(modal) {
    modal.classList.add('active');
}

function hideModal(modal) {
    modal.classList.remove('active');
}

function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message--${type}`;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
} 