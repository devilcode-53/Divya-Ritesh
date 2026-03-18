// ============================================
// Career Advisor System - Main Script
// Landing page functionality
// ============================================

const API_BASE = 'http://localhost:5000/api';

// ========== UTILITY FUNCTIONS ==========

// Show toast notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `
        <span>${icons[type] || 'ℹ️'}</span>
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Hide page loader
function hideLoader() {
    const loader = document.getElementById('pageLoader');
    if (loader) {
        setTimeout(() => loader.classList.add('hidden'), 500);
    }
}

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('token') !== null;
}

// Get stored user data
function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Get auth token
function getToken() {
    return localStorage.getItem('token');
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showToast('Logged out successfully!', 'success');
    setTimeout(() => window.location.href = 'index.html', 500);
}

// API request helper
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, message: 'Network error. Please try again.' };
    }
}

// ========== NAVIGATION ==========

function updateNavAuth() {
    const navAuth = document.getElementById('navAuth');
    if (!navAuth) return;

    if (isLoggedIn()) {
        const user = getUser();
        navAuth.innerHTML = `
            <div class="nav-user-info">
                <a href="dashboard.html" class="btn btn-sm btn-secondary">📊 Dashboard</a>
                <div class="nav-avatar" style="background: ${user?.avatar_color || '#F5C542'}">
                    ${user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <button class="btn btn-sm btn-outline" onclick="logout()" style="padding: 6px 14px;">Logout</button>
            </div>
        `;
    } else {
        navAuth.innerHTML = `
            <a href="login.html" class="btn btn-sm btn-secondary">Sign In</a>
            <a href="signup.html" class="btn btn-sm btn-primary">Get Started</a>
        `;
    }
}

// Navbar scroll effect
function initNavbarScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// Mobile menu toggle
function initMobileMenu() {
    const toggle = document.getElementById('mobileToggle');
    const navLinks = document.getElementById('navLinks');

    if (toggle && navLinks) {
        toggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
}

// ========== SCROLL REVEAL ANIMATION ==========

function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    reveals.forEach(el => observer.observe(el));
}

// ========== LOAD CAREERS ==========

async function loadCareers() {
    const grid = document.getElementById('careersGrid');
    if (!grid) return;

    const data = await apiRequest('/careers');

    if (data.success && data.careers) {
        grid.innerHTML = data.careers.map((career, i) => `
            <div class="glass-card career-card reveal reveal-delay-${(i % 4) + 1}" 
                 onclick="window.location.href='${isLoggedIn() ? `roadmap.html?careerId=${career.id}` : 'login.html'}'">
                <div class="career-card-icon">${career.icon}</div>
                <h3>${career.title}</h3>
                <p>${career.description.substring(0, 100)}...</p>
                <div class="career-card-meta">
                    <span class="career-demand ${career.demand_level.toLowerCase()}">${career.demand_level} Demand</span>
                    <span style="color: var(--text-gray); font-size: 0.75rem;">${career.avg_salary}</span>
                </div>
            </div>
        `).join('');

        // Re-initialize scroll reveal for new elements
        initScrollReveal();
    }
}

// ========== HERO BUTTONS ==========

function initHeroButtons() {
    const startBtn = document.getElementById('heroStartBtn');
    const ctaBtn = document.getElementById('ctaStartBtn');

    const handleStart = (e) => {
        if (!isLoggedIn()) {
            e.preventDefault();
            showToast('Please sign in first to take the assessment.', 'info');
            setTimeout(() => window.location.href = 'login.html', 1000);
        }
    };

    if (startBtn) startBtn.addEventListener('click', handleStart);
    if (ctaBtn) ctaBtn.addEventListener('click', handleStart);
}

// ========== COUNTER ANIMATION ==========

function animateCounters() {
    const stats = document.querySelectorAll('.hero-stat h3');
    stats.forEach(stat => {
        const target = stat.textContent;
        const isPercent = target.includes('%');
        const isPlus = target.includes('+');
        const num = parseInt(target);

        if (isNaN(num)) return;

        let current = 0;
        const increment = num / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= num) {
                current = num;
                clearInterval(timer);
            }
            stat.textContent = Math.floor(current) + (isPercent ? '%' : '') + (isPlus ? '+' : '');
        }, 30);
    });
}

// ========== INITIALIZE ==========

document.addEventListener('DOMContentLoaded', () => {
    hideLoader();
    updateNavAuth();
    initNavbarScroll();
    initMobileMenu();
    initScrollReveal();
    loadCareers();
    initHeroButtons();
    animateCounters();
});