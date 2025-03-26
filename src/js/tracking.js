import { auth, db } from './utils/firebase.js';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

// DOM Elements
const trackingNumberInput = document.getElementById('trackingNumber');
const trackBtn = document.getElementById('trackBtn');
const trackingContent = document.getElementById('trackingContent');
const trackingHistory = document.getElementById('trackingHistory');

// Event Listeners
trackBtn.addEventListener('click', handleTracking);
trackingNumberInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleTracking();
    }
});

// Check if user is logged in
auth.onAuthStateChanged((user) => {
    if (user) {
        loadUserOrders(user.uid);
    }
});

// Handle tracking search
async function handleTracking() {
    const trackingNumber = trackingNumberInput.value.trim();
    if (!trackingNumber) {
        showMessage('Please enter a tracking number', 'error');
        return;
    }

    try {
        const order = await findOrder(trackingNumber);
        if (order) {
            displayTrackingInfo(order);
        } else {
            showMessage('Order not found', 'error');
        }
    } catch (error) {
        console.error('Error tracking order:', error);
        showMessage('Error tracking order', 'error');
    }
}

// Find order by tracking number
async function findOrder(trackingNumber) {
    const ordersRef = collection(db, 'orders');
    const q = query(
        ordersRef,
        where('trackingNumber', '==', trackingNumber),
        limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    }
    return null;
}

// Load user's order history
async function loadUserOrders(userId) {
    try {
        const ordersRef = collection(db, 'orders');
        const q = query(
            ordersRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(5)
        );
        
        const querySnapshot = await getDocs(q);
        displayOrderHistory(querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })));
    } catch (error) {
        console.error('Error loading order history:', error);
    }
}

// Display tracking information
function displayTrackingInfo(order) {
    const statusSteps = [
        { status: 'Order Placed', icon: 'fa-shopping-cart' },
        { status: 'Processing', icon: 'fa-cog' },
        { status: 'Shipped', icon: 'fa-truck' },
        { status: 'Delivered', icon: 'fa-check-circle' }
    ];

    const currentStep = statusSteps.findIndex(step => step.status === order.status);

    const trackingHTML = `
        <div class="tracking-info">
            <div class="order-details">
                <h3>Order #${order.trackingNumber}</h3>
                <p>Placed on ${new Date(order.createdAt.toDate()).toLocaleDateString()}</p>
            </div>
            
            <div class="status-timeline">
                ${statusSteps.map((step, index) => `
                    <div class="status-step ${index <= currentStep ? 'completed' : ''}">
                        <div class="step-icon">
                            <i class="fas ${step.icon}"></i>
                        </div>
                        <div class="step-label">${step.status}</div>
                    </div>
                `).join('')}
            </div>

            <div class="delivery-info">
                <h4>Delivery Information</h4>
                <p><strong>Address:</strong> ${order.shippingAddress}</p>
                <p><strong>Estimated Delivery:</strong> ${order.estimatedDelivery}</p>
            </div>

            <div class="order-items">
                <h4>Order Items</h4>
                ${order.items.map(item => `
                    <div class="order-item">
                        <img src="${item.image}" alt="${item.name}">
                        <div class="item-details">
                            <h5>${item.name}</h5>
                            <p>Quantity: ${item.quantity}</p>
                            <p>Price: $${item.price}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    trackingContent.innerHTML = trackingHTML;
}

// Display order history
function displayOrderHistory(orders) {
    if (orders.length === 0) {
        trackingHistory.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <p>No orders found</p>
            </div>
        `;
        return;
    }

    const historyHTML = `
        <h3>Recent Orders</h3>
        <div class="order-list">
            ${orders.map(order => `
                <div class="order-card">
                    <div class="order-header">
                        <h4>Order #${order.trackingNumber}</h4>
                        <span class="order-date">
                            ${new Date(order.createdAt.toDate()).toLocaleDateString()}
                        </span>
                    </div>
                    <div class="order-status ${order.status.toLowerCase()}">
                        ${order.status}
                    </div>
                    <div class="order-total">
                        Total: $${order.total}
                    </div>
                    <button class="track-order-btn" data-id="${order.trackingNumber}">
                        Track Order
                    </button>
                </div>
            `).join('')}
        </div>
    `;

    trackingHistory.innerHTML = historyHTML;

    // Add event listeners to track buttons
    document.querySelectorAll('.track-order-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            trackingNumberInput.value = btn.dataset.id;
            handleTracking();
        });
    });
}

// Show message utility function
function showMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message--${type}`;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
} 