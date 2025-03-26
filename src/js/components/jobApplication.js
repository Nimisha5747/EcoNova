// Job Application Modal Content
function createJobApplicationModal() {
    const modal = document.getElementById('applyJobModal');
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2>Apply for a Job</h2>
            <form id="jobApplicationForm">
                <div class="form-group">
                    <label for="jobPosition">Select Position</label>
                    <select id="jobPosition" required>
                        <option value="">Choose a position</option>
                        <option value="hardware-engineer">Hardware Engineer</option>
                        <option value="delivery-agent">Delivery Agent</option>
                        <option value="recycling-specialist">Recycling Specialist</option>
                        <option value="quality-control">Quality Control Inspector</option>
                        <option value="warehouse-manager">Warehouse Manager</option>
                        <option value="customer-service">Customer Service Representative</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="fullName">Full Name</label>
                    <input type="text" id="fullName" required>
                </div>

                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" required>
                </div>

                <div class="form-group">
                    <label for="phone">Phone Number</label>
                    <input type="tel" id="phone" required>
                </div>

                <div class="form-group">
                    <label for="experience">Years of Experience</label>
                    <input type="number" id="experience" min="0" required>
                </div>

                <div class="form-group">
                    <label for="education">Education</label>
                    <select id="education" required>
                        <option value="">Select Education Level</option>
                        <option value="high-school">High School</option>
                        <option value="associate">Associate Degree</option>
                        <option value="bachelor">Bachelor's Degree</option>
                        <option value="master">Master's Degree</option>
                        <option value="phd">PhD</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="resume">Resume (PDF)</label>
                    <input type="file" id="resume" accept=".pdf" required>
                </div>

                <div class="form-group">
                    <label for="coverLetter">Cover Letter</label>
                    <textarea id="coverLetter" rows="5" required></textarea>
                </div>

                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="terms" required>
                        I agree to the terms and conditions
                    </label>
                </div>

                <button type="submit" class="submit-btn">Submit Application</button>
            </form>
        </div>
    `;

    // Add event listeners
    const jobApplicationForm = modal.querySelector('#jobApplicationForm');

    jobApplicationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const applicationData = {
            position: document.getElementById('jobPosition').value,
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            experience: document.getElementById('experience').value,
            education: document.getElementById('education').value,
            coverLetter: document.getElementById('coverLetter').value,
            resume: document.getElementById('resume').files[0],
            createdAt: new Date()
        };

        try {
            await submitJobApplication(applicationData);
        } catch (error) {
            alert(error.message);
        }
    });
}

// Export the function
export { createJobApplicationModal }; 