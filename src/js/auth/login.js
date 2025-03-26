import { auth } from '../../utils/firebase.js';
import { signInWithEmailAndPassword } from 'firebase/auth';

function setFormMessage(formElement, type, message) {
    const messageElement = formElement.querySelector('.form__message');
    messageElement.textContent = message;
    messageElement.className = `form__message form__message--${type}`;
}

export function createLoginModal() {
    const modal = document.getElementById('loginModal');
    if (!modal) return;

    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2>Login</h2>
            <form id="loginForm">
                <div class="form-group">
                    <label for="loginUsername">Email</label>
                    <input type="email" id="loginUsername" required>
                </div>
                <div class="form-group">
                    <label for="loginPassword">Password</label>
                    <input type="password" id="loginPassword" required>
                </div>
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="rememberMe">
                        Remember me
                    </label>
                </div>
                <div class="form__message"></div>
                <button type="submit" id="loginSubmit">Login</button>
            </form>
            <p>Don't have an account? <a href="#" id="linkSignUp">Sign Up</a></p>
            <p><a href="#" id="forgotPassword">Forgot Password?</a></p>
        </div>
    `;

    // Add event listeners
    const form = modal.querySelector('#loginForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            
            // If remember me is checked, set persistence
            if (rememberMe) {
                await auth.setPersistence('local');
            }

            // Redirect to home page after successful login
            window.location.href = '../index.html';
        } catch (error) {
            setFormMessage(form, 'error', error.message);
        }
    });

    // Link to sign up form
    modal.querySelector('#linkSignUp').addEventListener('click', (e) => {
        e.preventDefault();
        window.hideModal('loginModal');
        window.showModal('signUpModal');
    });

    // Forgot password link
    modal.querySelector('#forgotPassword').addEventListener('click', (e) => {
        e.preventDefault();
        alert('Password reset functionality will be implemented soon.');
    });
}
