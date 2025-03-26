import { auth, db } from '../utils/firebase.js';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Profile Modal Content
function createProfileModal() {
    const modal = document.getElementById('profileModal');
    if (!modal) return;

    const personalInfoForm = modal.querySelector('#personalInfoForm');
    const settingsForm = modal.querySelector('#settingsForm');

    // Load user data
    async function loadUserData() {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                
                // Update personal info form
                document.getElementById('profileName').value = userData.name || '';
                document.getElementById('profileEmail').value = userData.email || '';
                document.getElementById('profilePhone').value = userData.phone || '';
                document.getElementById('profileAddress').value = userData.address || '';

                // Update settings
                document.getElementById('emailNotifications').checked = userData.emailNotifications || false;
                document.getElementById('smsNotifications').checked = userData.smsNotifications || false;
                document.getElementById('language').value = userData.language || 'en';
                document.getElementById('timezone').value = userData.timezone || 'utc';
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            alert('Error loading user data. Please try again later.');
        }
    }

    // Load pickups
    async function loadPickups() {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const pickupsQuery = query(
                collection(db, 'pickups'),
                where('userId', '==', user.uid)
            );
            const pickupsSnapshot = await getDocs(pickupsQuery);
            
            const pickupsList = modal.querySelector('.pickups-list');
            pickupsList.innerHTML = pickupsSnapshot.docs.map(doc => {
                const pickup = doc.data();
                return `
                    <div class="pickup-item">
                        <div class="pickup-header">
                            <h3>Pickup #${doc.id}</h3>
                            <span class="status ${pickup.status}">${pickup.status}</span>
                        </div>
                        <div class="pickup-details">
                            <p>Date: ${pickup.date}</p>
                            <p>Time: ${pickup.time}</p>
                            <p>Items: ${pickup.items.length}</p>
                        </div>
                        <button onclick="trackPickup('${doc.id}')" class="track-btn">Track Status</button>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading pickups:', error);
            alert('Error loading pickups. Please try again later.');
        }
    }

    // Load purchases
    async function loadPurchases() {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const purchasesQuery = query(
                collection(db, 'purchases'),
                where('userId', '==', user.uid)
            );
            const purchasesSnapshot = await getDocs(purchasesQuery);
            
            const purchasesList = modal.querySelector('.purchases-list');
            purchasesList.innerHTML = purchasesSnapshot.docs.map(doc => {
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
        } catch (error) {
            console.error('Error loading purchases:', error);
            alert('Error loading purchases. Please try again later.');
        }
    }

    // Form submissions
    personalInfoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const user = auth.currentUser;
            if (!user) return;

            const userData = {
                name: document.getElementById('profileName').value,
                email: document.getElementById('profileEmail').value,
                phone: document.getElementById('profilePhone').value,
                address: document.getElementById('profileAddress').value
            };

            await updateDoc(doc(db, 'users', user.uid), userData);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert(error.message);
        }
    });

    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const user = auth.currentUser;
            if (!user) return;

            const settings = {
                emailNotifications: document.getElementById('emailNotifications').checked,
                smsNotifications: document.getElementById('smsNotifications').checked,
                language: document.getElementById('language').value,
                timezone: document.getElementById('timezone').value
            };

            await updateDoc(doc(db, 'users', user.uid), settings);
            alert('Settings updated successfully!');
        } catch (error) {
            console.error('Error updating settings:', error);
            alert(error.message);
        }
    });

    // Load initial data
    loadUserData();
    loadPickups();
    loadPurchases();
}

// Export the function
export { createProfileModal }; 