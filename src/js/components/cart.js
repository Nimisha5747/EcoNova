import { auth, db } from '../utils/firebase.js';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';

export function createCartModal() {
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.innerHTML = `
        <span class="close">&times;</span>
        <h2>My Cart</h2>
        <div class="cart-tabs">
            <button class="tab-btn active" data-tab="pickups">Pickups</button>
            <button class="tab-btn" data-tab="purchases">Purchases</button>
        </div>
        <div class="tab-content">
            <div id="pickups-tab" class="tab-pane active">
                <div class="pickups-list">
                    <!-- Pickups will be loaded here -->
                </div>
            </div>
            <div id="purchases-tab" class="tab-pane">
                <div class="purchases-list">
                    <!-- Purchases will be loaded here -->
                </div>
            </div>
        </div>
    `;

    // Add event listeners
    const closeBtn = modalContent.querySelector('.close');
    const tabBtns = modalContent.querySelectorAll('.tab-btn');
    const tabPanes = modalContent.querySelectorAll('.tab-pane');

    closeBtn.addEventListener('click', () => {
        modalContent.parentElement.style.display = 'none';
    });

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            // Add active class to clicked button and corresponding pane
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });

    // Load pickups and purchases
    loadPickups();
    loadPurchases();

    return modalContent;
}

async function loadPickups() {
    const pickupsList = document.querySelector('.pickups-list');
    if (!pickupsList) return;

    try {
        const user = auth.currentUser;
        if (!user) {
            pickupsList.innerHTML = '<p>Please log in to view your pickups.</p>';
            return;
        }

        const pickupsQuery = query(
            collection(db, 'pickups'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
        
        const pickupsSnapshot = await getDocs(pickupsQuery);

        if (pickupsSnapshot.empty) {
            pickupsList.innerHTML = '<p>No pickups found.</p>';
            return;
        }

        const pickupsHTML = pickupsSnapshot.docs.map(doc => {
            const pickup = doc.data();
            return `
                <div class="pickup-item">
                    <div class="pickup-header">
                        <h3>Pickup #${doc.id}</h3>
                        <span class="status ${pickup.status}">${pickup.status}</span>
                    </div>
                    <div class="pickup-details">
                        <p>Date: ${pickup.pickupDate}</p>
                        <p>Time: ${pickup.pickupTime}</p>
                        <p>Items: ${pickup.items.length}</p>
                    </div>
                    <button onclick="trackPickup('${doc.id}')" class="track-btn">Track Status</button>
                </div>
            `;
        }).join('');

        pickupsList.innerHTML = pickupsHTML;
    } catch (error) {
        console.error('Error loading pickups:', error);
        pickupsList.innerHTML = '<p>Error loading pickups. Please try again later.</p>';
    }
}

async function loadPurchases() {
    const purchasesList = document.querySelector('.purchases-list');
    if (!purchasesList) return;

    try {
        const user = auth.currentUser;
        if (!user) {
            purchasesList.innerHTML = '<p>Please log in to view your purchases.</p>';
            return;
        }

        const purchasesQuery = query(
            collection(db, 'purchases'),
            where('userId', '==', user.uid),
            orderBy('purchaseDate', 'desc')
        );
        
        const purchasesSnapshot = await getDocs(purchasesQuery);

        if (purchasesSnapshot.empty) {
            purchasesList.innerHTML = '<p>No purchases found.</p>';
            return;
        }

        const purchasesHTML = purchasesSnapshot.docs.map(doc => {
            const purchase = doc.data();
            return `
                <div class="purchase-item">
                    <img src="${purchase.item.image}" alt="${purchase.item.name}">
                    <div class="purchase-details">
                        <h3>${purchase.item.name}</h3>
                        <p>Price: $${purchase.item.price}</p>
                        <p>Purchase Date: ${purchase.purchaseDate.toDate().toLocaleDateString()}</p>
                    </div>
                </div>
            `;
        }).join('');

        purchasesList.innerHTML = purchasesHTML;
    } catch (error) {
        console.error('Error loading purchases:', error);
        purchasesList.innerHTML = '<p>Error loading purchases. Please try again later.</p>';
    }
}

// Helper functions for cart actions
window.trackPickup = async (pickupId) => {
    try {
        const pickupDoc = await getDoc(doc(db, 'pickups', pickupId));

        if (!pickupDoc.exists()) {
            alert('Pickup not found.');
            return;
        }

        const pickup = pickupDoc.data();
        alert(`
            Pickup Status: ${pickup.status}
            Scheduled Date: ${pickup.pickupDate}
            Scheduled Time: ${pickup.pickupTime}
            Address: ${pickup.address}
            Items: ${pickup.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
        `);
    } catch (error) {
        console.error('Error tracking pickup:', error);
        alert('Error tracking pickup. Please try again later.');
    }
};

window.generateCSRCertificate = async (pickupId) => {
    try {
        const pickupDoc = await getDoc(doc(db, 'pickups', pickupId));

        if (!pickupDoc.exists()) {
            alert('Pickup not found.');
            return;
        }

        const pickup = pickupDoc.data();
        const certificateData = {
            pickupId,
            userId: pickup.userId,
            date: pickup.pickupDate,
            items: pickup.items,
            totalWeight: pickup.items.reduce((sum, item) => sum + (item.weight || 0), 0),
            certificateNumber: `CSR-${Date.now()}`,
            issuedDate: new Date().toISOString().split('T')[0]
        };

        await setDoc(doc(db, 'certificates', certificateData.certificateNumber), certificateData);
        alert(`CSR Certificate generated successfully!\nCertificate Number: ${certificateData.certificateNumber}`);
    } catch (error) {
        console.error('Error generating CSR certificate:', error);
        alert('Error generating CSR certificate. Please try again later.');
    }
};

window.viewOrderDetails = async (orderId) => {
    try {
        const orderDoc = await getDoc(doc(db, 'purchases', orderId));

        if (!orderDoc.exists()) {
            alert('Order not found.');
            return;
        }

        const order = orderDoc.data();
        alert(`
            Order Details:
            Order Number: ${orderId}
            Date: ${order.purchaseDate}
            Status: ${order.status}
            Items:
            ${order.items.map(item => `- ${item.name} (${item.quantity}) - $${item.price}`).join('\n')}
            Total: $${order.total}
            Shipping Address: ${order.shippingAddress}
        `);
    } catch (error) {
        console.error('Error viewing order details:', error);
        alert('Error viewing order details. Please try again later.');
    }
}; 