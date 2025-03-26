import { auth, db } from '../utils/firebase.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    doc,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js';

// DOM Elements
const pickupForm = document.getElementById('pickupForm');
const savedAddressesContainer = document.getElementById('savedAddresses');
const addAddressBtn = document.getElementById('addAddressBtn');
const addressModal = document.getElementById('addressModal');
const addressForm = document.getElementById('addressForm');
const closeModalBtn = document.querySelector('.close-modal');
const pickupDateInput = document.getElementById('pickupDate');

// State
let addresses = [];
let selectedAddress = null;

// Set minimum date to today
const today = new Date().toISOString().split('T')[0];
pickupDateInput.min = today;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    if (!auth.currentUser) {
        window.location.href = 'login.html';
        return;
    }
    loadAddresses();
});

addAddressBtn.addEventListener('click', () => showModal(addressModal));
closeModalBtn.addEventListener('click', () => hideModal(addressModal));
addressForm.addEventListener('submit', handleAddressSubmit);
pickupForm.addEventListener('submit', handlePickupSubmit);

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

// Handle pickup form submission
async function handlePickupSubmit(e) {
    e.preventDefault();

    if (!selectedAddress) {
        showMessage('Please select a pickup address', 'error');
        return;
    }

    const formData = new FormData(pickupForm);
    const pickupData = {
        userId: auth.currentUser.uid,
        address: selectedAddress,
        pickupDate: formData.get('pickupDate'),
        pickupTime: formData.get('pickupTime'),
        itemType: formData.get('itemType'),
        itemCount: parseInt(formData.get('itemCount')),
        itemDescription: formData.get('itemDescription'),
        specialInstructions: formData.get('specialInstructions'),
        status: 'pending',
        createdAt: serverTimestamp()
    };

    try {
        await addDoc(collection(db, 'pickups'), pickupData);
        showMessage('Pickup scheduled successfully!', 'success');
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 2000);
    } catch (error) {
        console.error('Error scheduling pickup:', error);
        showMessage('Error scheduling pickup', 'error');
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