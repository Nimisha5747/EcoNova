import { auth, db } from '../utils/firebase.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

function setFormMessage(formElement, type, message) {
  const messageElement = formElement.querySelector(".form__message");
  messageElement.textContent = message;
  messageElement.classList.remove("form__message--success", "form__message--error");
  messageElement.classList.add(`form__message--${type}`);
}

function setInputError(inputElement, message) {
  inputElement.classList.add("form__input--error");
  inputElement.parentElement.querySelector(".form__input-error-message").textContent = message;
}

function clearInputError(inputElement) {
  inputElement.classList.remove("form__input--error");
  inputElement.parentElement.querySelector(".form__input-error-message").textContent = "";
}

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector("#linkLogin");
  const createAccountForm = document.querySelector("#createAccount");

  document.querySelector("#createAccount").addEventListener("click", e => {
    e.preventDefault();
    loginForm.classList.add("form--hidden");
    createAccountForm.classList.remove("form--hidden");
  });

  document.querySelector("#linkLogin").addEventListener("click", e => {
    e.preventDefault();
    loginForm.classList.remove("form--hidden");
    createAccountForm.classList.add("form--hidden");
  });

  loginForm.addEventListener("submit", e => {
    e.preventDefault();

    const submit = document.getElementById('submit');
    submit.addEventListener("click", async function(event) {
      event.preventDefault();
      const email = document.getElementById('signupUsername').value;
      const password = document.getElementById('signupPassword').value;
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        alert("Account created successfully!");
        // Additional success handling
      } catch (error) {
        setFormMessage(loginForm, "error", error.message);
      }
    });
  });

  document.querySelectorAll(".form__input").forEach(inputElement => {
    inputElement.addEventListener("blur", e => {
      if (e.target.id === "signupUsername" && e.target.value.length > 0 && e.target.value.length < 10) {
        setInputError(inputElement, "Username must be at least 10 characters in length");
      }
      if (e.target.id === "signupPassword" && e.target.value.length > 0 && e.target.value.length < 8) {
        setInputError(inputElement, "Password must be at least 8 characters in length");
      }
    });
    inputElement.addEventListener("input", e => {
      clearInputError(inputElement);
    });
  });
});

// Sign Up Modal Content
export function createSignUpModal() {
    const modal = document.getElementById('signUpModal');
    if (!modal) return;

    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2>Create Account</h2>
            <form id="signUpForm">
                <div class="form-group">
                    <label for="signupUsername">Email</label>
                    <input type="email" id="signupUsername" required>
                </div>
                <div class="form-group">
                    <label for="signupPassword">Password</label>
                    <input type="password" id="signupPassword" required>
                </div>
                <div class="form-group">
                    <label for="signupPasswordConfirm">Confirm Password</label>
                    <input type="password" id="signupPasswordConfirm" required>
                </div>
                <div class="form-group">
                    <label>User Type</label>
                    <div class="user-type-buttons">
                        <button type="button" class="user-type-btn active" data-type="individual">Individual</button>
                        <button type="button" class="user-type-btn" data-type="organization">Organization</button>
                    </div>
                </div>
                <div class="form-group organization-fields" style="display: none;">
                    <label for="orgName">Organization Name</label>
                    <input type="text" id="orgName">
                    <label for="orgType">Organization Type</label>
                    <select id="orgType">
                        <option value="business">Business</option>
                        <option value="nonprofit">Non-Profit</option>
                        <option value="government">Government</option>
                        <option value="educational">Educational</option>
                    </select>
                </div>
                <div class="form__message"></div>
                <button type="submit" id="submit">Create Account</button>
            </form>
            <p>Already have an account? <a href="#" id="linkLogin">Login</a></p>
        </div>
    `;

    // Add event listeners
    const form = modal.querySelector('#signUpForm');
    const userTypeButtons = modal.querySelectorAll('.user-type-btn');
    const organizationFields = modal.querySelector('.organization-fields');
    let selectedUserType = 'individual';

    userTypeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            userTypeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedUserType = btn.dataset.type;
            organizationFields.style.display = selectedUserType === 'organization' ? 'block' : 'none';
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signupUsername').value;
        const password = document.getElementById('signupPassword').value;
        const passwordConfirm = document.getElementById('signupPasswordConfirm').value;

        if (password !== passwordConfirm) {
            setFormMessage(form, 'error', 'Passwords do not match');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Add user details to Firestore
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                userType: selectedUserType,
                createdAt: new Date(),
                ...(selectedUserType === 'organization' && {
                    organizationName: document.getElementById('orgName').value,
                    organizationType: document.getElementById('orgType').value
                })
            });

            setFormMessage(form, 'success', 'Account created successfully!');
            setTimeout(() => {
                window.hideModal('signUpModal');
            }, 2000);
        } catch (error) {
            setFormMessage(form, 'error', error.message);
        }
    });

    // Link to login form
    modal.querySelector('#linkLogin').addEventListener('click', (e) => {
        e.preventDefault();
        window.hideModal('signUpModal');
        window.showModal('loginModal');
    });
}