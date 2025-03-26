// For Firebase JS SDK v7.20.0 and later, measurementId is optional
import {
    collection, onSnapshot,
    addDoc, deleteDoc, doc, getDocs, updateDoc, getDoc
} from 'firebase/firestore'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth, db } from './utils/firebase.js'
import { createLoginModal } from './auth/login.js'
import { createSignUpModal } from './auth/signUp.js'
import { createProfileModal } from './components/profile.js'
import { createCartModal } from './components/cart.js'
import { createPickupFormModal } from './components/pickupForm.js'
import { createJobApplicationModal } from './components/jobApplication.js'
import { initSlider } from './scroll.js'

//init services
const colRef = collection(db, 'books')

//real-collection data
onSnapshot(colRef , (snapshot) => {
    let books = []
    snapshot.docs.forEach((doc) => {
        books.push({...doc.data(),id: doc.id})
    })
    console.log(books)
})

//adding docs
const addBookForm = document.querySelector('.add')
addBookForm.addEventListener('submit', (e) => {
    e.preventDefault()    //in an html page , default action is that whn a sub,it button is hit , the page is refreshed , we want to avoid it , hence this is used
    addDoc(colRef, {
        title: addBookForm.title.value,  //here, addBookForm object calls the 'name' of the html file 'adddocs' section
        author: addBookForm.author.value,
    })
    .then(() => {
        addBookForm.reset()
    })
})

//deleting docs
const deleteBookForm = document.querySelector('.delete')
deleteBookForm.addEventListener('submit', (e) => {
    e.preventDefault()

    const docRef = doc(db,'books',deleteBookForm.id.value)
    deleteDoc(docRef)
       .then(() => {
        deleteBookForm.reset()
       })
})

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create modal content
    createLoginModal()
    createSignUpModal()
    createProfileModal()
    createCartModal()
    createPickupFormModal()
    createJobApplicationModal()

    // Initialize slider
    initSlider()

    // Modal Functions
    window.showModal = (modalId) => {
        const modal = document.getElementById(modalId)
        if (modal) {
            modal.style.display = 'block'
            modal.classList.add('active')
        }
    }

    window.hideModal = (modalId) => {
        const modal = document.getElementById(modalId)
        if (modal) {
            modal.style.display = 'none'
            modal.classList.remove('active')
        }
    }

    // Event Listeners
    const loginBtn = document.getElementById('loginBtn')
    const signUpBtn = document.getElementById('signUpBtn')
    const cartBtn = document.getElementById('cartBtn')
    const profileBtn = document.getElementById('profileBtn')
    const schedulePickupBtn = document.getElementById('schedulePickupBtn')
    const buyItemsBtn = document.getElementById('buyItemsBtn')
    const applyJobBtn = document.getElementById('applyJobBtn')
    const trackPickupBtn = document.getElementById('trackPickupBtn')
    const csrCertificateBtn = document.getElementById('csrCertificateBtn')
    const contactUsBtn = document.getElementById('contactUsBtn')

    if (loginBtn) loginBtn.addEventListener('click', () => showModal('loginModal'))
    if (signUpBtn) signUpBtn.addEventListener('click', () => showModal('signUpModal'))
    if (cartBtn) cartBtn.addEventListener('click', () => showModal('cartModal'))
    if (profileBtn) profileBtn.addEventListener('click', () => showModal('profileModal'))
    if (schedulePickupBtn) schedulePickupBtn.addEventListener('click', () => showModal('pickupFormModal'))
    if (buyItemsBtn) buyItemsBtn.addEventListener('click', () => showModal('buyItemsModal'))
    if (applyJobBtn) applyJobBtn.addEventListener('click', () => showModal('applyJobModal'))
    if (trackPickupBtn) trackPickupBtn.addEventListener('click', () => showModal('trackPickupModal'))
    if (csrCertificateBtn) csrCertificateBtn.addEventListener('click', () => showModal('csrCertificateModal'))
    if (contactUsBtn) contactUsBtn.addEventListener('click', () => showModal('contactUsModal'))

    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal')
            if (modal) {
                modal.style.display = 'none'
                modal.classList.remove('active')
            }
        })
    })

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none'
            e.target.classList.remove('active')
        }
    })

    // Check authentication state
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            if (loginBtn) loginBtn.style.display = 'none'
            if (signUpBtn) signUpBtn.style.display = 'none'
            if (profileBtn) profileBtn.style.display = 'block'
        } else {
            // User is signed out
            if (loginBtn) loginBtn.style.display = 'block'
            if (signUpBtn) signUpBtn.style.display = 'block'
            if (profileBtn) profileBtn.style.display = 'none'
        }
    })
})

// Sign Up Functionality
async function handleSignUp(email, password, userType) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user
        
        // Add user details to Firestore
        await addDoc(collection(db, 'users'), {
            uid: user.uid,
            email: user.email,
            userType: userType,
            createdAt: new Date()
        })

        alert('Sign up successful!')
        hideModal('signUpModal')
    } catch (error) {
        alert(error.message)
    }
}

// Login Functionality
async function handleLogin(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password)
        alert('Login successful!')
        hideModal('loginModal')
    } catch (error) {
        alert(error.message)
    }
}

// Pickup Form Steps
let currentStep = 1
const totalSteps = 5

function updateProgressBar() {
    const progress = (currentStep / totalSteps) * 100
    document.querySelector('.progress').style.width = `${progress}%`
}

function nextStep() {
    if (currentStep < totalSteps) {
        currentStep++
        updateProgressBar()
        showStep(currentStep)
    }
}

function previousStep() {
    if (currentStep > 1) {
        currentStep--
        updateProgressBar()
        showStep(currentStep)
    }
}

// Pickup Form Data
let pickupData = {
    userType: '',
    items: [],
    address: '',
    date: '',
    time: '',
    csrCertificate: false
}

// Save pickup data
async function savePickupData() {
    try {
        const user = auth.currentUser
        if (!user) {
            alert('Please login first')
            return
        }

        await addDoc(collection(db, 'pickups'), {
            ...pickupData,
            userId: user.uid,
            status: 'pending',
            createdAt: new Date()
        })

        alert('Pickup scheduled successfully!')
        hideModal('pickupFormModal')
    } catch (error) {
        alert(error.message)
    }
}

// Cart Functionality
let cart = []

function addToCart(item) {
    cart.push(item)
    updateCartDisplay()
}

function removeFromCart(index) {
    cart.splice(index, 1)
    updateCartDisplay()
}

function updateCartDisplay() {
    const cartContent = document.querySelector('#cartModal .modal-content')
    cartContent.innerHTML = `
        <h2>Your Cart</h2>
        <div class="cart-items">
            ${cart.map((item, index) => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="item-details">
                        <h3>${item.name}</h3>
                        <p>${item.price}</p>
                    </div>
                    <button onclick="removeFromCart(${index})">Remove</button>
                </div>
            `).join('')}
        </div>
    `
}

// Job Application
async function submitJobApplication(applicationData) {
    try {
        await addDoc(collection(db, 'jobApplications'), {
            ...applicationData,
            status: 'pending',
            createdAt: new Date()
        })
        alert('Application submitted successfully!')
        hideModal('applyJobModal')
    } catch (error) {
        alert(error.message)
    }
}

// Contact Form
document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const messageData = {
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message'),
        createdAt: new Date()
    }

    try {
        await addDoc(collection(db, 'messages'), messageData)
        alert('Message sent successfully!')
        e.target.reset()
    } catch (error) {
        alert(error.message)
    }
})

// Track Pickup Status
async function trackPickup(pickupId) {
    try {
        const pickupDoc = await getDoc(doc(db, 'pickups', pickupId))
        if (pickupDoc.exists()) {
            const pickupData = pickupDoc.data()
            showPickupStatus(pickupData)
        } else {
            alert('Pickup not found')
        }
    } catch (error) {
        alert(error.message)
    }
}

// CSR Certificate Generation
async function generateCSRCertificate(pickupId) {
    try {
        const pickupDoc = await getDoc(doc(db, 'pickups', pickupId))
        if (pickupDoc.exists()) {
            const pickupData = pickupDoc.data()
            // Generate certificate logic here
            alert('CSR Certificate generated successfully!')
        }
    } catch (error) {
        alert(error.message)
    }
}