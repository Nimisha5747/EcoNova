// Pickup Form Modal Content
function createPickupFormModal() {
    const modal = document.getElementById('pickupFormModal');
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2>Schedule Pickup</h2>
            <div class="progress-bar">
                <div class="progress" style="width: 20%"></div>
            </div>
            <div class="form-steps">
                <!-- Step 1: User Type -->
                <div class="step active" data-step="1">
                    <h3>Step 1: Select User Type</h3>
                    <div class="user-type-selection">
                        <button class="user-type-btn active" data-type="individual">Individual</button>
                        <button class="user-type-btn" data-type="organization">Organization</button>
                    </div>
                </div>

                <!-- Step 2: Item Selection -->
                <div class="step" data-step="2">
                    <h3>Step 2: Select Items</h3>
                    <div class="item-selection">
                        <div class="item-category">
                            <h4>Electronics</h4>
                            <div class="item-grid">
                                <div class="item-card">
                                    <i class="fas fa-laptop"></i>
                                    <h5>Laptop</h5>
                                    <input type="number" min="0" value="0" data-item="laptop">
                                </div>
                                <div class="item-card">
                                    <i class="fas fa-mobile-alt"></i>
                                    <h5>Phone</h5>
                                    <input type="number" min="0" value="0" data-item="phone">
                                </div>
                                <div class="item-card">
                                    <i class="fas fa-tablet-alt"></i>
                                    <h5>Tablet</h5>
                                    <input type="number" min="0" value="0" data-item="tablet">
                                </div>
                            </div>
                        </div>
                        <div class="item-category">
                            <h4>Appliances</h4>
                            <div class="item-grid">
                                <div class="item-card">
                                    <i class="fas fa-tv"></i>
                                    <h5>TV</h5>
                                    <input type="number" min="0" value="0" data-item="tv">
                                </div>
                                <div class="item-card">
                                    <i class="fas fa-snowflake"></i>
                                    <h5>Refrigerator</h5>
                                    <input type="number" min="0" value="0" data-item="refrigerator">
                                </div>
                                <div class="item-card">
                                    <i class="fas fa-washing-machine"></i>
                                    <h5>Washing Machine</h5>
                                    <input type="number" min="0" value="0" data-item="washing-machine">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Step 3: Address -->
                <div class="step" data-step="3">
                    <h3>Step 3: Pickup Address</h3>
                    <form id="addressForm">
                        <div class="form-group">
                            <label for="street">Street Address</label>
                            <input type="text" id="street" required>
                        </div>
                        <div class="form-group">
                            <label for="city">City</label>
                            <input type="text" id="city" required>
                        </div>
                        <div class="form-group">
                            <label for="state">State</label>
                            <input type="text" id="state" required>
                        </div>
                        <div class="form-group">
                            <label for="zipCode">ZIP Code</label>
                            <input type="text" id="zipCode" required>
                        </div>
                        <div class="form-group">
                            <label for="landmark">Landmark (Optional)</label>
                            <input type="text" id="landmark">
                        </div>
                    </form>
                </div>

                <!-- Step 4: Date and Time -->
                <div class="step" data-step="4">
                    <h3>Step 4: Select Date & Time</h3>
                    <div class="datetime-selection">
                        <div class="form-group">
                            <label for="pickupDate">Pickup Date</label>
                            <input type="date" id="pickupDate" required>
                        </div>
                        <div class="form-group">
                            <label for="pickupTime">Pickup Time</label>
                            <select id="pickupTime" required>
                                <option value="">Select Time</option>
                                <option value="09:00">9:00 AM</option>
                                <option value="10:00">10:00 AM</option>
                                <option value="11:00">11:00 AM</option>
                                <option value="12:00">12:00 PM</option>
                                <option value="13:00">1:00 PM</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Step 5: CSR Certificate -->
                <div class="step" data-step="5">
                    <h3>Step 5: CSR Certificate</h3>
                    <div class="csr-option">
                        <label class="checkbox-label">
                            <input type="checkbox" id="csrCertificate">
                            I would like to receive a CSR Certificate for this pickup
                        </label>
                        <p class="csr-info">A CSR Certificate will be generated and sent to your email after the pickup is completed.</p>
                    </div>
                </div>
            </div>

            <div class="form-navigation">
                <button class="prev-btn" style="display: none;">Previous</button>
                <button class="next-btn">Next</button>
                <button class="submit-btn" style="display: none;">Schedule Pickup</button>
            </div>
        </div>
    `;

    // Add event listeners
    const steps = modal.querySelectorAll('.step');
    const progressBar = modal.querySelector('.progress');
    const prevBtn = modal.querySelector('.prev-btn');
    const nextBtn = modal.querySelector('.next-btn');
    const submitBtn = modal.querySelector('.submit-btn');
    let currentStep = 1;

    function updateNavigation() {
        prevBtn.style.display = currentStep === 1 ? 'none' : 'block';
        nextBtn.style.display = currentStep === 5 ? 'none' : 'block';
        submitBtn.style.display = currentStep === 5 ? 'block' : 'none';
    }

    function showStep(stepNumber) {
        steps.forEach(step => {
            step.classList.remove('active');
            if (parseInt(step.dataset.step) === stepNumber) {
                step.classList.add('active');
            }
        });
        updateNavigation();
    }

    function updateProgress() {
        const progress = (currentStep / 5) * 100;
        progressBar.style.width = `${progress}%`;
    }

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            showStep(currentStep);
            updateProgress();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentStep < 5) {
            currentStep++;
            showStep(currentStep);
            updateProgress();
        }
    });

    submitBtn.addEventListener('click', async () => {
        // Collect all form data
        const userType = modal.querySelector('.user-type-btn.active').dataset.type;
        const items = Array.from(modal.querySelectorAll('.item-card input')).map(input => ({
            type: input.dataset.item,
            quantity: parseInt(input.value)
        })).filter(item => item.quantity > 0);

        const address = {
            street: document.getElementById('street').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            zipCode: document.getElementById('zipCode').value,
            landmark: document.getElementById('landmark').value
        };

        const date = document.getElementById('pickupDate').value;
        const time = document.getElementById('pickupTime').value;
        const csrCertificate = document.getElementById('csrCertificate').checked;

        // Save pickup data
        try {
            await savePickupData({
                userType,
                items,
                address,
                date,
                time,
                csrCertificate
            });
        } catch (error) {
            alert(error.message);
        }
    });
}

// Export the function
export { createPickupFormModal }; 