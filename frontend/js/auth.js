// ============================================
// Authentication Script - Login & Signup
// ============================================

const API_BASE = 'http://localhost:5000/api';

// ========== UTILITY FUNCTIONS (duplicated for standalone pages) ==========
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `
        <span>${icons[type]}</span>
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function hideLoader() {
    const loader = document.getElementById('pageLoader');
    if (loader) setTimeout(() => loader.classList.add('hidden'), 300);
}

// ========== VALIDATION ==========

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFieldError(groupId, errorId, message) {
    const group = document.getElementById(groupId);
    const error = document.getElementById(errorId);
    if (group) group.classList.add('error');
    if (error) {
        error.textContent = message;
        error.style.display = 'block';
    }
}

function clearFieldError(groupId, errorId) {
    const group = document.getElementById(groupId);
    const error = document.getElementById(errorId);
    if (group) group.classList.remove('error');
    if (error) error.style.display = 'none';
}

function clearAllErrors() {
    document.querySelectorAll('.form-group').forEach(g => g.classList.remove('error'));
    document.querySelectorAll('.form-error').forEach(e => e.style.display = 'none');
}

// ========== LOGIN ==========

function initLogin() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAllErrors();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Validate
        let valid = true;

        if (!email) {
            showFieldError('emailGroup', 'emailError', 'Email is required.');
            valid = false;
        } else if (!validateEmail(email)) {
            showFieldError('emailGroup', 'emailError', 'Please enter a valid email.');
            valid = false;
        }

        if (!password) {
            showFieldError('passwordGroup', 'passwordError', 'Password is required.');
            valid = false;
        }

        if (!valid) return;

        // Submit
        const btn = document.getElementById('loginBtn');
        btn.textContent = 'Signing in...';
        btn.disabled = true;

        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                showToast('Login successful! Redirecting...', 'success');
                setTimeout(() => window.location.href = 'dashboard.html', 1000);
            } else {
                showToast(data.message || 'Login failed.', 'error');
                btn.textContent = 'Sign In';
                btn.disabled = false;
            }
        } catch (error) {
            showToast('Network error. Please try again.', 'error');
            btn.textContent = 'Sign In';
            btn.disabled = false;
        }
    });

    // Live validation clear
    document.getElementById('email')?.addEventListener('input', () => clearFieldError('emailGroup', 'emailError'));
    document.getElementById('password')?.addEventListener('input', () => clearFieldError('passwordGroup', 'passwordError'));
}

// ========== SIGNUP ==========

function initSignup() {
    const form = document.getElementById('signupForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAllErrors();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate
        let valid = true;

        if (!name || name.length < 2) {
            showFieldError('nameGroup', 'nameError', 'Name must be at least 2 characters.');
            valid = false;
        }

        if (!email) {
            showFieldError('emailGroup', 'emailError', 'Email is required.');
            valid = false;
        } else if (!validateEmail(email)) {
            showFieldError('emailGroup', 'emailError', 'Please enter a valid email.');
            valid = false;
        }

        if (!password) {
            showFieldError('passwordGroup', 'passwordError', 'Password is required.');
            valid = false;
        } else if (password.length < 6) {
            showFieldError('passwordGroup', 'passwordError', 'Password must be at least 6 characters.');
            valid = false;
        }

        if (password !== confirmPassword) {
            showFieldError('confirmPasswordGroup', 'confirmPasswordError', 'Passwords do not match.');
            valid = false;
        }

        if (!valid) return;

        // Submit
        const btn = document.getElementById('signupBtn');
        btn.textContent = 'Creating Account...';
        btn.disabled = true;

        try {
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                showToast('Account created successfully!', 'success');
                setTimeout(() => window.location.href = 'dashboard.html', 1000);
            } else {
                showToast(data.message || 'Signup failed.', 'error');
                btn.textContent = 'Create Account';
                btn.disabled = false;
            }
        } catch (error) {
            showToast('Network error. Please try again.', 'error');
            btn.textContent = 'Create Account';
            btn.disabled = false;
        }
    });

    // Live validation clear
    document.getElementById('name')?.addEventListener('input', () => clearFieldError('nameGroup', 'nameError'));
    document.getElementById('email')?.addEventListener('input', () => clearFieldError('emailGroup', 'emailError'));
    document.getElementById('password')?.addEventListener('input', () => clearFieldError('passwordGroup', 'passwordError'));
    document.getElementById('confirmPassword')?.addEventListener('input', () => clearFieldError('confirmPasswordGroup', 'confirmPasswordError'));
}

// ========== REDIRECT IF LOGGED IN ==========

function checkAuth() {
    if (localStorage.getItem('token')) {
        window.location.href = 'dashboard.html';
    }
}

// ========== INITIALIZE ==========

document.addEventListener('DOMContentLoaded', () => {
    hideLoader();
    checkAuth();
    initLogin();
    initSignup();
});