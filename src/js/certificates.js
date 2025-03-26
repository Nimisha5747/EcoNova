import { storage } from './utils/firebase.js';
import { ref, getDownloadURL } from 'firebase/storage';

// DOM Elements
const modal = document.getElementById('certificateModal');
const modalTitle = document.getElementById('modalTitle');
const certificateImage = document.getElementById('certificateImage');
const closeModal = document.querySelector('.close-modal');
const viewCertificateBtn = document.querySelector('.view-certificate-btn');

// Certificate data
const certificateData = {
    iso14001: {
        title: ' Green Citizen certificate ',
        image: '/src/assets/images/certificate.png'
    }
};

// Event Listeners
viewCertificateBtn.addEventListener('click', () => {
    const certId = viewCertificateBtn.dataset.cert;
    showCertificate(certId);
});

closeModal.addEventListener('click', hideModal);

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        hideModal();
    }
});

// Functions
async function showCertificate(certId) {
    try {
        const cert = certificateData[certId];
        if (!cert) {
            throw new Error('Certificate not found');
        }

        // Set modal title
        modalTitle.textContent = cert.title;

        // Load certificate image
        const imageRef = ref(storage, cert.image);
        const imageUrl = await getDownloadURL(imageRef);
        certificateImage.src = imageUrl;

        // Show modal
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading certificate:', error);
        showMessage('Error loading certificate. Please try again.', 'error');
    }
}

function hideModal() {
    modal.style.display = 'none';
    certificateImage.src = '';
}

function showMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message--${type}`;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);

    // Remove message after 3 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Add animation delays to verification steps
document.querySelectorAll('.step').forEach((step, index) => {
    step.style.animationDelay = `${index * 0.2}s`;
}); 